import type { MovementContext } from '../MovementContext.js';
/**
 * Source-style CheckStuck: if the hull starts a tick overlapping solid
 * (possible where brushes overlap, e.g. Λ ramp ridges), nudge it out to the
 * nearest free spot instead of letting the move pipeline grind against
 * geometry it's inside of. Returns true only when hopelessly wedged (then
 * we also kill velocity so gravity can't pump it while pinned).
 */
export declare function checkStuck(ctx: MovementContext): boolean;
