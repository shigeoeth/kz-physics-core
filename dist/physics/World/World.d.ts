/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Vec3 } from '../../math/vec3.js';
import type { Brush, LadderVolume, TraceResult } from '../Collision/Collision.types.js';
export declare class World {
    solids: Brush[];
    ladders: LadderVolume[];
    private grid;
    private gridBrushCount;
    private readonly bounds;
    /**
     * Drops the broadphase index. It is rebuilt automatically when `solids`
     * changes length; call this after editing an existing brush in place
     * (moving its min/max, or swapping an entry for another brush).
     */
    rebuildIndex(): void;
    private index;
    /** Pass `out` to reuse a result object instead of allocating one. */
    trace(start: Vec3, end: Vec3, mins: Vec3, maxs: Vec3, out?: TraceResult): TraceResult;
    /** Can a hull of mins/maxs exist at origin without intersecting the world? */
    isPositionFree(origin: Vec3, mins: Vec3, maxs: Vec3): boolean;
    ladderAt(origin: Vec3, mins: Vec3, maxs: Vec3): LadderVolume | null;
}
