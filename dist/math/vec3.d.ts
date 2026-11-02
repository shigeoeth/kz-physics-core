/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
export interface Vec3 {
    x: number;
    y: number;
    z: number;
}
export declare function vec3(x?: number, y?: number, z?: number): Vec3;
export declare function copy(out: Vec3, a: Vec3): Vec3;
export declare function set(out: Vec3, x: number, y: number, z: number): Vec3;
export declare function add(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function sub(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function addScaled(out: Vec3, a: Vec3, b: Vec3, s: number): Vec3;
export declare function scale(out: Vec3, a: Vec3, s: number): Vec3;
export declare function dot(a: Vec3, b: Vec3): number;
export declare function cross(out: Vec3, a: Vec3, b: Vec3): Vec3;
export declare function length(a: Vec3): number;
export declare function lengthSq(a: Vec3): number;
/** Horizontal (ground-plane) speed — x/z since y is up. */
export declare function length2D(a: Vec3): number;
/** Normalizes in place; returns the original length. */
export declare function normalize(a: Vec3): number;
export declare function clone(a: Vec3): Vec3;
