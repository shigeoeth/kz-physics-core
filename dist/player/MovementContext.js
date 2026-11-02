/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
// The shape every extracted movement behavior (Jump, WalkMove, TryPlayerMove,
// ...) operates on. PlayerController implements this directly — its instance
// fields ARE the context fields, so passing `this` to a behavior function is
// free: no wrapper object, no proxying, no per-tick allocation. The scratch
// vectors (wishDir/moveEnd/tmpA/tmpB) are reused across ticks for the same
// reason the original monolithic class reused them.
/** Shared by every behavior that turns ctx.yaw/pitch (degrees) into a direction vector. */
export const DEG2RAD = Math.PI / 180;
