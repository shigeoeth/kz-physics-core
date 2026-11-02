import type { LadderVolume } from '../../physics/Collision/Collision.types.js';
import { type MovementContext } from '../MovementContext.js';
export declare function checkLadder(ctx: MovementContext): LadderVolume | null;
export declare function ladderMove(ctx: MovementContext, dt: number, ladder: LadderVolume): void;
