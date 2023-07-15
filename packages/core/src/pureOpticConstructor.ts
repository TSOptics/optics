import PureOpticImpl from './PureOptic.impl';
import { PureOptic } from './PureOptic';
import { total } from './types';

export function pureOptic<A, S>(get: (s: S) => A, set: (a: A, s: S) => S, key?: string): PureOptic<A, total, S>;
export function pureOptic<S>(key?: string): PureOptic<S, total, S>;
export function pureOptic<A, S>(
    getOrKey?: string | ((s: S) => A),
    set?: (a: A, s: S) => S,
    key?: string,
): PureOptic<A, total, S> {
    if (typeof getOrKey === 'function') {
        return new PureOpticImpl([{ get: getOrKey, set: set as any, key: key ?? 'custom optic' }]) as any;
    }
    return new PureOpticImpl([{ get: (s) => s, set: (a) => a, key: getOrKey || 'custom optic' }]) as any;
}
