/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
// Tiny mutable vector helpers — plain objects, no allocation in hot paths.
// Y is up (Source's z maps to y).
export function vec3(x = 0, y = 0, z = 0) {
    return { x, y, z };
}
export function copy(out, a) {
    out.x = a.x;
    out.y = a.y;
    out.z = a.z;
    return out;
}
export function set(out, x, y, z) {
    out.x = x;
    out.y = y;
    out.z = z;
    return out;
}
export function add(out, a, b) {
    out.x = a.x + b.x;
    out.y = a.y + b.y;
    out.z = a.z + b.z;
    return out;
}
export function sub(out, a, b) {
    out.x = a.x - b.x;
    out.y = a.y - b.y;
    out.z = a.z - b.z;
    return out;
}
export function addScaled(out, a, b, s) {
    out.x = a.x + b.x * s;
    out.y = a.y + b.y * s;
    out.z = a.z + b.z * s;
    return out;
}
export function scale(out, a, s) {
    out.x = a.x * s;
    out.y = a.y * s;
    out.z = a.z * s;
    return out;
}
export function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
export function cross(out, a, b) {
    const x = a.y * b.z - a.z * b.y;
    const y = a.z * b.x - a.x * b.z;
    const z = a.x * b.y - a.y * b.x;
    return set(out, x, y, z);
}
export function length(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}
export function lengthSq(a) {
    return a.x * a.x + a.y * a.y + a.z * a.z;
}
/** Horizontal (ground-plane) speed — x/z since y is up. */
export function length2D(a) {
    return Math.sqrt(a.x * a.x + a.z * a.z);
}
/** Normalizes in place; returns the original length. */
export function normalize(a) {
    const len = length(a);
    if (len > 0) {
        const inv = 1 / len;
        a.x *= inv;
        a.y *= inv;
        a.z *= inv;
    }
    return len;
}
export function clone(a) {
    return { x: a.x, y: a.y, z: a.z };
}
