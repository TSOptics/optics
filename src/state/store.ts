import { OpticType, total } from '../types';
import OpticImpl from './Optic.impl';
import { Optic } from './Optic.types';

export type Store<T = any> = { state: T; listeners: Set<(root: T) => void> };

export const stores: WeakMap<OpticImpl<any, OpticType, any>, Store> = new WeakMap();

export function createStore<T>(initialValue: T, key?: string): Optic<T, total, T> {
    const rootOptic = new OpticImpl<T, total, T>(
        [
            {
                key: key ?? 'store',
                get: (s) => s,
                set: (a) => a,
            },
        ],
        initialValue,
    );
    return rootOptic as any;
}
