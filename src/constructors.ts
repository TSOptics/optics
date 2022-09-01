import { BaseOptic } from './BaseOptic';
import { partial, total } from './types';
import { stabilize } from './utils';

export function optic<A, S>(get: (s: S) => A, set: (a: A, s: S) => S, key?: string): BaseOptic<A, total, S>;
export function optic<S>(key?: string): BaseOptic<S, total, S>;
export function optic<A, S>(
    getOrKey?: string | ((s: S) => A),
    set?: (a: A, s: S) => S,
    key?: string,
): BaseOptic<A, total, S> {
    if (typeof getOrKey === 'function') {
        return new BaseOptic([{ get: stabilize(getOrKey), set: set as any, key: key ?? 'custom optic' }]);
    }
    return new BaseOptic([{ get: (s) => s, set: (a) => a, key: getOrKey || 'custom optic' }]);
}

export function opticPartial<A, S>(
    get: (s: S) => A | undefined,
    set: (a: A, s: S) => S,
    key?: string,
): BaseOptic<A, partial, S>;
export function opticPartial<S>(key?: string): BaseOptic<S, partial, S>;
export function opticPartial<A, S>(
    getOrKey?: string | ((s: S) => A),
    set?: (a: A, s: S) => S,
    key?: string,
): BaseOptic<A, partial, S> {
    if (typeof getOrKey === 'function') {
        return new BaseOptic([{ get: stabilize(getOrKey), set: set as any, key: key ?? 'custom partial optic' }]);
    }
    return new BaseOptic([{ get: (s) => s, set: (a) => a, key: getOrKey || 'custom partial optic' }]);
}
