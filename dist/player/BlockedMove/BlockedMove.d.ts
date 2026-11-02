import type { MovementContext } from '../MovementContext.js';
/**
 * Freeze breaker: no legitimate state has large velocity while the
 * position integrates nothing tick after tick — that pattern means the
 * mover is wedged against geometry in a way the clip loop can't resolve
 * (razor-thin float alignments at plane seams). Left alone it becomes a
 * runaway velocity accumulator (gravity keeps getting clip-converted while
 * the position is pinned). Detect it and dump the energy.
 */
export declare function detectBlockedMove(ctx: MovementContext): void;
