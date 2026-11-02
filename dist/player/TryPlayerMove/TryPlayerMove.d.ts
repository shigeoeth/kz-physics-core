import type { MovementContext } from '../MovementContext.js';
/**
 * Source's TryPlayerMove: sweep, clip velocity against every plane touched
 * this tick (creases slide along the shared edge), repeat up to 4 bumps.
 */
export declare function tryPlayerMove(ctx: MovementContext, dt: number): void;
