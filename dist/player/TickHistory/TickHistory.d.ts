/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MovementContext } from '../MovementContext.js';
export declare class TickHistory {
    private total;
    private readonly state;
    private readonly keys;
    private readonly flags;
    private readonly contactCounts;
    private readonly contacts;
    record(ctx: MovementContext): void;
    /** Recorded ticks, oldest first, one line each. */
    toString(): string;
}
