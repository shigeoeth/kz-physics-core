/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Vec3 } from '../math/vec3.js';
import type { LadderVolume, TraceResult } from '../physics/Collision/Collision.types.js';
import type { World } from '../physics/World/World.js';
import type { Settings } from '../settings/Settings.js';
import type { ContactLog } from './ContactLog/ContactLog.js';
/** Shared by every behavior that turns ctx.yaw/pitch (degrees) into a direction vector. */
export declare const DEG2RAD: number;
export interface InputState {
    forward: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    duck: boolean;
    walk: boolean;
    reset: boolean;
}
export interface MovementContext {
    readonly world: World;
    readonly settings: Settings;
    /** Called on anomalies (unstuck pops, velocity kills). */
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
    /** Position snapshot from the start of this tick, for blocked-move detection. */
    prevPos: Vec3;
    prevEye: number;
    currEye: number;
    landPunch: number;
    /** 0..settings.stamina.max; only meaningful while settings.stamina.enabled. */
    stamina: number;
    /** Quality of the most recent takeoff; only set while settings.perf.enabled. */
    lastHopQuality: 'perfect' | 'normal' | null;
    readonly input: InputState;
    oldJump: boolean;
    ladderCooldown: number;
    fallVelocity: number;
    groundTicksSinceLanding: number;
    /** True once a real jump (via checkJump) has ever launched this life — gates the perfect-bhop carry. */
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
    /** Reusable trace output; only valid until the next trace made with it. */
    readonly traceResult: TraceResult;
    readonly mins: Vec3;
    readonly maxs: Vec3;
    readonly horizontalSpeed: number;
}
