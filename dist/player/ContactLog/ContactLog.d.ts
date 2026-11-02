/**
 * @license
 * @unsurf/cs-movement — Counter-Strike style movement physics
 * Copyright 2026 unsurf
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Vec3 } from '../../math/vec3.js';
export declare class ContactLog {
    readonly data: Float64Array<ArrayBuffer>;
    count: number;
    push(normal: Vec3, fraction: number): void;
    clear(): void;
    /** Space-separated "nx,ny,nz@fraction" entries. */
    toString(): string;
}
export declare function formatContacts(data: ArrayLike<number>, offset: number, count: number): string;
