/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Vec3 } from '../../math/vec3.js';
/**
 * Air acceleration — the bhop/surf formula. Note the deliberate asymmetry:
 * `addspeed` uses the 30 u/s capped wishspeed, but `accelspeed` uses the
 * UNCAPPED wishspeed. That is exactly what Source does, and it's why large
 * sv_airaccelerate values give near-instant air control. There is no cap on
 * the resulting velocity, which is what lets strafing exceed maxspeed.
 */
export declare function airAccelerate(vel: Vec3, wishdir: Vec3, wishspeed: number, airaccel: number, dt: number, airCap?: number): void;
