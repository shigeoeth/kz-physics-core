/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Vec3 } from '../../math/vec3.js';
import type { Brush, TraceResult } from './Collision.types.js';
export type { Plane, Brush, LadderVolume, TraceResult } from './Collision.types.js';
export declare function brushFromAABB(min: Vec3, max: Vec3): Brush;
/**
 * Oriented box brush from a center, half-extents, and an orthonormal basis
 * (the box's local x/y/z axes in world space). Axis-aligned "bevel" planes
 * from the box's AABB corners are added, as Quake's compiler does, so the
 * plane-expansion trace stays correct near edges of rotated brushes.
 */
export declare function brushFromOrientedBox(center: Vec3, halfExtents: Vec3, ax: Vec3, ay: Vec3, az: Vec3): Brush;
export declare function createTraceResult(): TraceResult;
/** Padded AABB of a whole move, for the broadphase. Written into `out` as [minX, minY, minZ, maxX, maxY, maxZ]. */
export declare function sweepBounds(start: Vec3, end: Vec3, mins: Vec3, maxs: Vec3, out: Float64Array): void;
/**
 * Trace a box through every brush. Pass `out` to reuse a result object
 * (allocation-free); the returned object is `out` in that case.
 */
export declare function traceBox(start: Vec3, end: Vec3, mins: Vec3, maxs: Vec3, brushes: Brush[], out?: TraceResult): TraceResult;
/**
 * Same as traceBox but only against `brushes[ids[0..count)]` — a candidate
 * list from a spatial index. `ids` must be ascending so tie-breaking between
 * equidistant brushes matches the linear scan exactly.
 */
export declare function traceBoxCandidates(start: Vec3, end: Vec3, mins: Vec3, maxs: Vec3, brushes: Brush[], ids: Int32Array, count: number, bounds: Float64Array, out: TraceResult): TraceResult;
/** True if a box at `origin` overlaps the (convex) volume. */
export declare function boxInBrush(origin: Vec3, mins: Vec3, maxs: Vec3, brush: Brush): boolean;
