/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
// Provenance (Valve source-sdk-2013, game/shared/gamemovement.cpp): CGameMovement::Friction
/**
 * Ground friction. Only horizontal components bleed speed (y is vertical and
 * is zeroed while grounded anyway).
 */
export function applyFriction(vel, friction, stopspeed, dt) {
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (speed < 0.1)
        return;
    const control = speed < stopspeed ? stopspeed : speed;
    const drop = control * friction * dt;
    let newspeed = speed - drop;
    if (newspeed < 0)
        newspeed = 0;
    if (newspeed !== speed) {
        const ratio = newspeed / speed;
        vel.x *= ratio;
        vel.z *= ratio;
    }
}
