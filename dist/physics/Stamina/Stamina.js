/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Add a stamina cost (jump or landing), clamped to the pool max.
 */
export function addStamina(current, cost, max) {
    return Math.min(max, current + cost);
}
/**
 * Recover stamina toward 0 at `recoveryRate` (fraction of max per second).
 */
export function recoverStamina(current, recoveryRate, max, dt) {
    return Math.max(0, current - recoveryRate * max * dt);
}
/**
 * How much a full-ish stamina pool throttles max speed / jump velocity:
 * 1.0 at an empty pool, down to `1 - maxPenalty` at a full one.
 */
export function staminaPenaltyMultiplier(current, max, maxPenalty) {
    if (max <= 0)
        return 1;
    const frac = Math.min(1, current / max);
    return 1 - frac * maxPenalty;
}
