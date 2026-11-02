/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Vec3 } from '../../math/vec3.js';
/**
 * Ground friction. Only horizontal components bleed speed (y is vertical and
 * is zeroed while grounded anyway).
 */
export declare function applyFriction(vel: Vec3, friction: number, stopspeed: number, dt: number): void;
