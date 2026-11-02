/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MovementContext } from '../MovementContext.js';
/**
 * Chromium's pointer lock occasionally emits a single bogus huge
 * movementX/Y (notably right after (re)acquiring the lock or on focus
 * glitches), which reads as the view "snapping". Filter: drop the first
 * event after a lock change, and drop isolated spikes that are both
 * large and far out of line with the previous event.
 *
 * Returns a mousemove handler plus the pointerlockchange hook it needs
 * wired up (both close over the same discard/last-sample state).
 */
export declare function createMouseInputHandlers(ctx: MovementContext): {
    onPointerLockChange: () => void;
    onMouseMove: (dx: number, dy: number) => void;
};
