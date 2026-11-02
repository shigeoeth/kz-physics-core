#!/usr/bin/env node
/**
 * @license
 * Headless sim-harness for @unsurf/cs-movement (migration plan, Stage 1).
 * Tool code — Apache-2.0 (same license as the library).
 *
 * Runs a JSON scene through PlayerController.tick() and writes a
 * machine-readable per-tick history + jump summary. It does NOT change any
 * physics: it only drives the public API of dist/ (the build of src/) and
 * reads public fields (origin, velocity, onGround, ducked, input, yaw,
 * contactsThisTick). tickHistoryText() is deliberately not used as the data
 * source: it is a lossy ring buffer (Float32 contacts, fixed decimals).
 *
 * Usage:
 *   node tools/sim-scene.mjs <scene.json> [outDir] # default outDir: sim-output/<scene-id>
 *   node tools/sim-scene.mjs --update-golden       # regenerate goldens (explicit only)
 *   node tools/sim-scene.mjs --check-golden        # compare output vs golden, exit 1 on diff
 *
 * Requires `npm run build` (dist/) — auto-run once if dist/index.js is missing.
 * Exit codes: 0 ok / golden match; 1 golden mismatch or scene error.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SCENES_DIR = join(HERE, 'scenes');
const GOLDEN_DIR = join(HERE, 'golden');
const DIST_INDEX = join(ROOT, 'dist', 'index.js');

const FORMAT_VERSION = 1;

// ---------------------------------------------------------------- utilities

function fail(msg) {
  console.error(`[sim-scene] ERROR: ${msg}`);
  process.exit(1);
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/** Fixed number of significant digits: stable across locales/platforms. */
function fmt(n, sig = 10) {
  if (typeof n !== 'number') return String(n); // booleans/strings pass through
  if (!Number.isFinite(n)) fail(`non-finite number encountered: ${n}`);
  return Number(n.toPrecision(sig)).toString();
}

function ensureDist() {
  if (!existsSync(DIST_INDEX)) {
    console.log('[sim-scene] dist/ missing — running `npm run build` (tsc only, no network)…');
    execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
  }
}

// ------------------------------------------------------------ scene loading

function loadScene(path) {
  const scene = JSON.parse(readFileSync(path, 'utf8'));
  if (scene.format !== FORMAT_VERSION) {
    fail(`scene ${path}: expected format ${FORMAT_VERSION}, got ${JSON.stringify(scene.format)}`);
  }
  if (!scene.id || !Array.isArray(scene.ticks)) fail(`scene ${path}: missing id or ticks`);
  if (!scene.timestep || scene.timestep.hz <= 0) fail(`scene ${path}: missing timestep`);
  if (!scene.state) fail(`scene ${path}: missing state (initial position/velocity)`);
  return scene;
}

function buildWorld(mod, geometry) {
  const world = new mod.World();
  for (const b of geometry.brushes ?? []) {
    if (b.kind === 'aabb') {
      world.solids.push(mod.brushFromAABB(mod.vec3(...b.min), mod.vec3(...b.max)));
    } else if (b.kind === 'orientedBox') {
      const e = b.halfExtents;
      const deg = (d) => (d * Math.PI) / 180;
      // Tilt about the vertical Y axis by `yawDeg`; identity when 0. Kept
      // simple on purpose — stage-2 scenes (walls/steps) can extend later.
      const yr = deg(b.yawDeg ?? 0);
      const ax = mod.vec3(Math.cos(yr), 0, -Math.sin(yr));
      const ay = mod.vec3(0, 1, 0);
      const az = mod.vec3(Math.sin(yr), 0, Math.cos(yr));
      world.solids.push(
        mod.brushFromOrientedBox(mod.vec3(...b.center), mod.vec3(e[0], e[1], e[2]), ax, ay, az),
      );
    } else {
      fail(`unknown brush kind ${JSON.stringify(b.kind)}`);
    }
  }
  return world;
}

function makeSettings(mod, overrides) {
  return { ...structuredClone(mod.DEFAULT_SETTINGS), ...overrides };
}

// ------------------------------------------------------------------ runner

async function runScene(scene) {
  const mod = await import(DIST_INDEX);
  const world = buildWorld(mod, scene.geometry ?? { brushes: [] });
  const settings = makeSettings(mod, scene.settings ?? {});
  const st = scene.state;
  const player = new mod.PlayerController(world, settings, mod.vec3(...st.position));
  player.velocity = mod.vec3(...st.velocity);
  player.yaw = st.yaw ?? 0;
  player.pitch = st.pitch ?? 0;
  // Pre-seed "jump held last tick" so a first-tick +jump obeys the scene's
  // autobhop/pogo semantics exactly like a real continuous hold would.
  player.oldJump = st.jumpHeldBefore ?? false;
  if (st.ducked) {
    fail('state.ducked=true at spawn is not supported; drive ducking with input keys instead');
  }

  const dt = 1 / scene.timestep.hz;
  if (scene.timestep.mode !== 'fixed-tick') fail(`only fixed-tick supported, got ${JSON.stringify(scene.timestep.mode)}`);

  // Settle phase: run "settleTicks" ticks with NO input until the player is
  // actually grounded (spawn may be above the floor — gravity settling must
  // not be confused with a jump landing). These ticks ARE recorded in the
  // history (tick numbering includes them) so the output is fully faithful.
  const settleLimit = scene.settle?.ticks ?? 64;
  let settledIn = -1;
  for (let i = 0; i < settleLimit; i++) {
    player.contactsThisTick.clear();
    player.tick(dt);
    if (player.onGround) {
      settledIn = i + 1;
      break;
    }
  }
  if (settledIn < 0) fail(`player never became grounded within ${settleLimit} settle ticks`);

  // Key letters: W S A D J C H (forward back left right jump duck walk).
  const KEY_FIELDS = [['W', 'forward'], ['S', 'back'], ['A', 'left'], ['D', 'right'], ['J', 'jump'], ['C', 'duck'], ['H', 'walk']];

  // Phase machine: "grounded" -> "airborne" -> "landed". Spawning above the
  // floor means gravity-settling is NOT a landing; we only start looking for
  // takeoff once the player has actually been grounded, and only look for
  // landing after a real takeoff.
  const history = [];
  let phase = 'grounded';
  let prevOnGround = player.onGround; // true after the settle loop above
  let takeoff = null; // end of the tick that transitioned grounded -> airborne
  let landing = null; // end of the tick that transitioned airborne -> grounded
  let maxHeight = -Infinity;

  for (let i = 0; i < scene.ticks.length; i++) {
    const cmd = scene.ticks[i];
    const keys = cmd.keys ?? '';
    for (const [ch, field] of KEY_FIELDS) player.input[field] = keys.includes(ch);
    if (cmd.yaw !== undefined) player.yaw = cmd.yaw;

    // Contacts logged below belong to THIS tick: clear before ticking
    // (PlayerController clears them only inside recordTick, which we bypass).
    player.contactsThisTick.clear();
    player.tick(dt);

    const contacts = [];
    const clog = player.contactsThisTick;
    for (let k = 0; k < clog.count; k++) {
      const o = k * 4; // CONTACT_STRIDE
      contacts.push({
        n: [clog.data[o], clog.data[o + 1], clog.data[o + 2]],
        fraction: clog.data[o + 3],
      });
    }

    const rec = {
      tick: settledIn + i, // absolute tick index since harness start (settle ticks included)
      time: (settledIn + i + 1) * dt,
      position: [player.origin.x, player.origin.y, player.origin.z],
      velocity: [player.velocity.x, player.velocity.y, player.velocity.z],
      onGround: player.onGround,
      surfing: player.surfing,
      ducked: player.ducked,
      duckFrac: player.duckFrac,
      yaw: player.yaw,
      keys,
      contacts,
    };
    history.push(rec);

    maxHeight = Math.max(maxHeight, player.origin.y);
    if (phase === 'grounded') {
      // Waiting for the first real takeoff. Gravity-settling onto the spawn
      // floor doesn't count as anything; grounded -> airborne does.
      if (!player.onGround && prevOnGround) {
        takeoff = {
          tick: i,
          position: [...rec.position],
          velocity: [...rec.velocity],
          hspeed: Math.hypot(rec.velocity[0], rec.velocity[2]),
        };
        phase = 'airborne';
      }
    } else if (phase === 'airborne' && player.onGround) {
      landing = {
        tick: i,
        position: [...rec.position],
        velocity: [...rec.velocity],
        hspeed: Math.hypot(rec.velocity[0], rec.velocity[2]),
      };
      phase = 'landed';
      break; // end rule: stop at the first landing tick (flight fully measured)
    }
    prevOnGround = player.onGround;
  }

  if (history.length === 0) fail('no ticks executed');
  const last = history[history.length - 1];
  const finish = scene.finish ?? {};
  if (finish.requireLanding && !landing) fail('scene requires landing but none happened within the tick budget');

  const originDistance = Math.hypot(last.position[0] - st.position[0], last.position[2] - st.position[2]);
  const summary = {
    sceneId: scene.id,
    format: FORMAT_VERSION,
    notes: scene.notes ?? '',
    config: {
      sceneSettings: scene.settings ?? {},
      timestepHz: scene.timestep.hz,
      dtSeconds: dt,
      ticksConfigured: scene.ticks.length,
      ticksRun: history.length,
      coordinateSystem: 'Y-up, Source units (1 unit = 1 inch)',
      originConvention: 'feet center (hull mins.y = 0); standing hull 32x32x72, ducked 32x32x54',
    },
    start: {
      position: st.position,
      velocity: st.velocity,
      yaw: st.yaw ?? 0,
      jumpHeldBefore: st.jumpHeldBefore ?? false,
      hullAtSpawn: 'standing',
    },
    takeoff,
    landing,
    flight: takeoff && landing ? { ticks: landing.tick - takeoff.tick, seconds: (landing.tick - takeoff.tick) * dt } : null,
    maxHeightOriginY: maxHeight,
    endPosition: last.position,
    distance: {
      metric: 'origin-to-origin horizontal (X/Z), feet-center points; NO hull-width correction applied',
      rawUnits: originDistance,
      plusHullWidthCorrection: originDistance + 32, // reported separately, never mixed in
    },
    caveats: [
      'landing.position is the end-of-tick origin after ground snap, not an exact contact point',
      'contacts are planes recorded inside tryPlayerMove only; friction/stayOnGround/categorize traces are not logged',
      'numbers are IEEE-754 doubles serialized with 10 significant digits',
    ],
  };

  return { history, summary };
}

// -------------------------------------------------------------- text dump

function historyToText(history) {
  const lines = [];
  for (const r of history) {
    const p = r.position.map((v) => fmt(v)).join(',');
    const v = r.velocity.map((v) => fmt(v)).join(',');
    const flags = `${r.onGround ? 'G' : 'A'}${r.surfing ? 's' : ''}${r.ducked ? 'd' : ''}`;
    const c = r.contacts.map((k) => `${k.n.map((x) => fmt(x, 6)).join(',')}@${fmt(k.fraction, 6)}`).join(' ');
    lines.push(`${r.tick} t=${fmt(r.time, 8)} p=${p} v=${v} ${flags} keys=${r.keys || '-'} yaw=${fmt(r.yaw, 8)}${c ? ` c=[${c}]` : ''}`);
  }
  return lines.join('\n') + '\n';
}

function summaryToText(summary) {
  const s = summary.start;
  const l = [
    `scene: ${summary.sceneId}`,
    `notes: ${summary.notes}`,
    `format: ${summary.format}`,
    `config: ${JSON.stringify(summary.config)}`,
    `start: pos=[${s.position.map((x) => fmt(x)).join(',')}] vel=[${s.velocity.map((x) => fmt(x)).join(',')}] yaw=${fmt(s.yaw)} jumpHeldBefore=${s.jumpHeldBefore}`,
    `takeoff: ${summary.takeoff ? `tick=${summary.takeoff.tick} pos=[${summary.takeoff.position.map((x) => fmt(x)).join(',')}] vel=[${summary.takeoff.velocity.map((x) => fmt(x)).join(',')}] hspeed=${fmt(summary.takeoff.hspeed)}` : 'none'}`,
    `landing: ${summary.landing ? `tick=${summary.landing.tick} pos=[${summary.landing.position.map((x) => fmt(x)).join(',')}] vel=[${summary.landing.velocity.map((x) => fmt(x)).join(',')}] hspeed=${fmt(summary.landing.hspeed)}` : 'none'}`,
    `flight: ${summary.flight ? `${summary.flight.ticks} ticks = ${fmt(summary.flight.seconds, 8)} s` : 'n/a'}`,
    `maxHeightOriginY: ${fmt(summary.maxHeightOriginY)}`,
    `endPosition: [${summary.endPosition.map((x) => fmt(x)).join(',')}]`,
    `distanceRaw(origin-to-origin,horizontal): ${fmt(summary.distance.rawUnits)}`,
    `distancePlus32(reported separately): ${fmt(summary.distance.plusHullWidthCorrection)}`,
    `caveats: ${summary.caveats.join(' | ')}`,
  ];
  return l.join('\n') + '\n';
}

// --------------------------------------------------------------- CLI modes

function canonicalJson(obj) {
  // Stable key order so goldens don't churn on property insertion order.
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalJson);
  const out = {};
  for (const k of Object.keys(obj).sort()) out[k] = canonicalJson(obj[k]);
  return out;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--update-golden' || args[0] === '--check-golden') {
    const mode = args[0] === '--update-golden' ? 'update' : 'check';
    ensureDist();
    const files = readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json')).sort();
    if (files.length === 0) fail('no scenes in tools/scenes');
    mkdirSync(GOLDEN_DIR, { recursive: true });
    let mismatches = 0;
    for (const f of files) {
      const scene = loadScene(join(SCENES_DIR, f));
      const { history, summary } = await runScene(scene);
      const text = JSON.stringify(canonicalJson({ summary, history }), null, 2) + '\n';
      const hash = sha256(Buffer.from(text));
      const gpath = join(GOLDEN_DIR, `${scene.id}.json`);
      const meta = {
        sceneFile: `tools/scenes/${f}`,
        goldenSha256: hash,
        environment: {
          node: process.version,
          platform: `${process.platform}/${process.arch}`,
          libVersion: JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version,
          sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT }).toString().trim(),
          note: 'identity verified ONLY in this environment class; cross-platform bit-exactness is NOT claimed',
        },
      };
      if (mode === 'update') {
        writeFileSync(gpath, text);
        writeFileSync(join(GOLDEN_DIR, `${scene.id}.meta.json`), JSON.stringify(canonicalJson(meta), null, 2) + '\n');
        console.log(`[golden] wrote ${scene.id}.json sha256=${hash}`);
      } else {
        if (!existsSync(gpath)) {
          console.error(`[golden] MISSING ${gpath} — run --update-golden first (never auto-refresh)`);
          mismatches++;
          continue;
        }
        const oldHash = sha256(Buffer.from(readFileSync(gpath, 'utf8')));
        if (oldHash === hash) {
          console.log(`[golden] OK ${scene.id} sha256=${hash}`);
        } else {
          console.error(`[golden] MISMATCH ${scene.id}: golden=${oldHash} current=${hash}`);
          console.error('  Behavior changed. Inspect manually; re-record with --update-golden only after review.');
          mismatches++;
        }
      }
    }
    process.exit(mismatches ? 1 : 0);
  }

  if (args.length < 1) {
    console.log('usage: node tools/sim-scene.mjs <scene.json> [outDir] | --update-golden | --check-golden');
    process.exit(1);
  }
  ensureDist();
  const scene = loadScene(resolve(args[0]));
  const { history, summary } = await runScene(scene);
  const outDir = resolve(args[1] ?? join(ROOT, 'sim-output', scene.id));
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'history.json'), JSON.stringify(canonicalJson({ summary, history }), null, 2) + '\n');
  writeFileSync(join(outDir, 'history.txt'), historyToText(history));
  writeFileSync(join(outDir, 'summary.txt'), summaryToText(summary));
  console.log(summaryToText(summary));
  console.log(`[sim-scene] wrote ${outDir}/{history.json,history.txt,summary.txt}`);
}

main().catch((e) => fail(e.stack ?? String(e)));
