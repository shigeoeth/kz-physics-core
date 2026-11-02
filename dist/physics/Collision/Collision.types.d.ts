/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Vec3 } from '../../math/vec3.js';
export interface Plane {
    normal: Vec3;
    dist: number;
}
export interface Brush {
    planes: Plane[];
    min: Vec3;
    max: Vec3;
}
export interface LadderVolume extends Brush {
    /** Direction the climbable face points (away from the wall, horizontal). */
    facing: Vec3;
}
export interface TraceResult {
    fraction: number;
    endPos: Vec3;
    normal: Vec3 | null;
    startSolid: boolean;
    allSolid: boolean;
}
