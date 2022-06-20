import { total } from '../types';
import { StoreOptic } from './StoreOptic';

export type Store<T = any> = { state: T; listeners: Set<(root: T) => void> };

export const stores: Map<object, Store> = new Map();

export function createStore<T>(initialValue: T, key?: string) {
    const storeId = {};

    const rootOptic = new StoreOptic<T, total, T>(
        [
            {
                key: key ?? 'store',
                get: (s) => s,
                set: (a) => a,
            },
        ],
        storeId,
        initialValue,
    );
    return rootOptic;
}
