/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Brush } from '../Collision/Collision.types.js';
export declare class SpatialGrid {
    private readonly cells;
    private readonly oversized;
    private readonly stamp;
    private stampCounter;
    /** Result of the last query: ids[0..count) ascending. */
    ids: Int32Array<ArrayBuffer>;
    count: number;
    constructor(brushes: readonly Brush[]);
    /** Gathers candidates for bounds [minX,minY,minZ,maxX,maxY,maxZ]. Returns false if the caller should scan linearly. */
    query(bounds: Float64Array): boolean;
    private add;
    /** Candidate lists are tiny, so insertion sort beats anything fancier. */
    private sortIds;
}
