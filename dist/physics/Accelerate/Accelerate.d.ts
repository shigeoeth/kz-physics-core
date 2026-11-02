/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Vec3 } from '../../math/vec3.js';
/**
 * Ground acceleration. The `addspeed = wishspeed - dot(vel, wishdir)` term is
 * what caps ground speed at maxspeed: once you're moving at wishspeed in the
 * wish direction no more speed is added.
 */
export declare function accelerate(vel: Vec3, wishdir: Vec3, wishspeed: number, accel: number, dt: number): void;
