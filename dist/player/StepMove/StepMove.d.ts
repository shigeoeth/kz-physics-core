import type { MovementContext } from '../MovementContext.js';
/**
 * Source's StepMove: run the move directly, then again with an 18-unit
 * step-up first; keep whichever version travelled farther horizontally.
 */
export declare function stepMove(ctx: MovementContext, dt: number): void;
