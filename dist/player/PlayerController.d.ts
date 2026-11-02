/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Vec3 } from '../math/vec3.js';
import type { LadderVolume, TraceResult } from '../physics/Collision/Collision.types.js';
import type { World } from '../physics/World/World.js';
import type { Settings } from '../settings/Settings.js';
import { type InputState, type MovementContext } from './MovementContext.js';
import { ContactLog } from './ContactLog/ContactLog.js';
/** Optional host hooks. Movement never logs or touches globals on its own. */
export interface PlayerOptions {
    /** Called on anomalies (unstuck pops, velocity kills). Default: no-op. */
    log?: (msg: string) => void;
}
export declare class PlayerController implements MovementContext {
    readonly world: World;
    readonly settings: Settings;
    readonly log: (msg: string) => void;
    origin: Vec3;
    velocity: Vec3;
    yaw: number;
    pitch: number;
    onGround: boolean;
    groundNormal: Vec3;
    ducked: boolean;
    duckFrac: number;
    onLadder: LadderVolume | null;
    /** True while standing on a surf-steep slope (airborne rules, no friction). */
    surfing: boolean;
    /** True from the moment surfing starts until the next real ground landing. */
    surfedSinceGrounded: boolean;
    prevPos: Vec3;
    currPos: Vec3;
    prevEye: number;
    currEye: number;
    landPunch: number;
    /** 0..settings.stamina.max; only meaningful while settings.stamina.enabled. */
    stamina: number;
    /** Quality of the most recent takeoff; only set while settings.perf.enabled. */
    lastHopQuality: 'perfect' | 'normal' | null;
    readonly input: InputState;
    oldJump: boolean;
    private keyJumpHeld;
    private wheelJumpQueued;
    private inputBound;
    ladderCooldown: number;
    fallVelocity: number;
    groundTicksSinceLanding: number;
    hasJumpedBefore: boolean;
    /** Horizontal velocity snapshotted the instant of the last landing; see PerfBonus. */
    landingVelocity: Vec3;
    stuckTicks: number;
    blockedTicks: number;
    contactsThisTick: ContactLog;
    readonly wishDir: Vec3;
    readonly moveEnd: Vec3;
    readonly tmpA: Vec3;
    readonly tmpB: Vec3;
    readonly traceResult: TraceResult;
    private readonly tickHistory;
    private readonly spawn;
    constructor(world: World, settings: Settings, spawn: Vec3, opts?: PlayerOptions);
    /**
     * Rolling record of every simulated tick (position, velocity, inputs,
     * contact planes), oldest first. Pull it when you want a movement dump —
     * the library never registers globals to push it anywhere.
     */
    tickHistoryText(): string;
    get mins(): Vec3;
    get maxs(): Vec3;
    get eyeHeight(): number;
    get horizontalSpeed(): number;
    bindInput(target: HTMLElement): void;
    respawn(): void;
    tick(dt: number): void;
    private recordTick;
}
