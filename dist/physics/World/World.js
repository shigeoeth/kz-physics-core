import { boxInBrush, createTraceResult, sweepBounds, traceBox, traceBoxCandidates } from '../Collision/Collision.js';
import { GRID_MIN_BRUSHES } from '../SpatialGrid/SpatialGrid.config.js';
import { SpatialGrid } from '../SpatialGrid/SpatialGrid.js';
export class World {
    solids = [];
    ladders = [];
    grid = null;
    gridBrushCount = -1;
    bounds = new Float64Array(6);
    /**
     * Drops the broadphase index. It is rebuilt automatically when `solids`
     * changes length; call this after editing an existing brush in place
     * (moving its min/max, or swapping an entry for another brush).
     */
    rebuildIndex() {
        this.grid = null;
        this.gridBrushCount = -1;
    }
    index() {
        if (this.solids.length < GRID_MIN_BRUSHES)
            return null;
        if (this.grid === null || this.gridBrushCount !== this.solids.length) {
            this.grid = new SpatialGrid(this.solids);
            this.gridBrushCount = this.solids.length;
        }
        return this.grid;
    }
    /** Pass `out` to reuse a result object instead of allocating one. */
    trace(start, end, mins, maxs, out = createTraceResult()) {
        const grid = this.index();
        if (grid !== null) {
            sweepBounds(start, end, mins, maxs, this.bounds);
            if (grid.query(this.bounds)) {
                return traceBoxCandidates(start, end, mins, maxs, this.solids, grid.ids, grid.count, this.bounds, out);
            }
        }
        return traceBox(start, end, mins, maxs, this.solids, out);
    }
    /** Can a hull of mins/maxs exist at origin without intersecting the world? */
    isPositionFree(origin, mins, maxs) {
        const grid = this.index();
        if (grid !== null) {
            sweepBounds(origin, origin, mins, maxs, this.bounds);
            if (grid.query(this.bounds)) {
                for (let i = 0; i < grid.count; i++) {
                    if (boxInBrush(origin, mins, maxs, this.solids[grid.ids[i]]))
                        return false;
                }
                return true;
            }
        }
        // Linear fallback: a cheap AABB reject first, as traceBox's broadphase does.
        const loX = origin.x + mins.x, hiX = origin.x + maxs.x;
        const loY = origin.y + mins.y, hiY = origin.y + maxs.y;
        const loZ = origin.z + mins.z, hiZ = origin.z + maxs.z;
        const solids = this.solids;
        for (let i = 0; i < solids.length; i++) {
            const brush = solids[i];
            if (brush.min.x > hiX || brush.max.x < loX ||
                brush.min.y > hiY || brush.max.y < loY ||
                brush.min.z > hiZ || brush.max.z < loZ) {
                continue;
            }
            if (boxInBrush(origin, mins, maxs, brush))
                return false;
        }
        return true;
    }
    ladderAt(origin, mins, maxs) {
        for (const ladder of this.ladders) {
            if (boxInBrush(origin, mins, maxs, ladder))
                return ladder;
        }
        return null;
    }
}
