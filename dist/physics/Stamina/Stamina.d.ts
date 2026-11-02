/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Add a stamina cost (jump or landing), clamped to the pool max.
 */
export declare function addStamina(current: number, cost: number, max: number): number;
/**
 * Recover stamina toward 0 at `recoveryRate` (fraction of max per second).
 */
export declare function recoverStamina(current: number, recoveryRate: number, max: number, dt: number): number;
/**
 * How much a full-ish stamina pool throttles max speed / jump velocity:
 * 1.0 at an empty pool, down to `1 - maxPenalty` at a full one.
 */
export declare function staminaPenaltyMultiplier(current: number, max: number, maxPenalty: number): number;
