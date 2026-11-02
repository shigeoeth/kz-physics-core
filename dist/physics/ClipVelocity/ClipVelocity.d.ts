/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Vec3 } from '../../math/vec3.js';
/**
 * Slide velocity along a plane. overbounce 1.0 (surf) removes exactly the
 * into-plane component; 1.001 (ordinary clipping) removes a hair more so the
 * player doesn't re-penetrate the plane next tick.
 */
export declare function clipVelocity(vel: Vec3, normal: Vec3, overbounce: number): void;
