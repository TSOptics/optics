import { OpticType, total } from './types';
import { Optic } from './Optic';

export type Store<T = any> = { state: T; listeners: Set<(root: T) => void> };

export const stores: WeakMap<Optic<any, OpticType>, Store> = new WeakMap();

export function createStore<T>(initialValue: T, key?: string) {
    const rootOptic = new Optic<T, total, T>(
        [
            {
                key: key ?? 'store',
                get: (s) => s,
                set: (a) => a,
            },
        ],
        initialValue,
    );
    return rootOptic;
}
