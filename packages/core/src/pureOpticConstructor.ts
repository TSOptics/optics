import PureOpticImpl from './PureOptic.impl';
import { PureOptic } from './PureOptic';
import { total } from './types';

export function pureOptic<S>(key?: string): PureOptic<S, total, S> {
    return new PureOpticImpl([{ get: (s) => s, set: (a) => a, key: key || 'custom optic' }]) as any;
}
