import { Optic } from '../Optic';
import { FocusedValue, Lens, OpticType, total } from '../types';

export type Store<T = any> = { state: T; key: symbol };

const stores: Map<symbol, [store: Store, listeners: Set<(root: any) => void>]> = new Map();

export const getStore = (optic: Optic<any, OpticType, Store>) => {
    const key = optic.ˍˍunsafeGetLenses()[0].key;
    if (typeof key !== 'symbol') {
        throw new Error("This optic isn't linked to a store");
    }
    return stores.get(key)?.[0] as Store;
};

export const setStore = (store: Store) => {
    const listeners = stores.get(store.key)?.[1] ?? new Set();
    stores.set(store.key, [store, listeners]);
    listeners.forEach((listener) => listener(store.state));
};

export const subscribe = <T, TOpticType extends OpticType>(
    optic: Optic<T, TOpticType, Store>,
    listener: (t: FocusedValue<T, TOpticType>) => void,
) => {
    const store = getStore(optic);
    const listeners = stores.get(store.key)?.[1];
    listeners?.add(listener);
    return () => {
        listeners?.delete(listener);
    };
};

export function createStore<T>(initialValue: T, key?: string) {
    const keySymbol = Symbol(key ?? 'store');
    stores.set(keySymbol, [{ key: keySymbol, state: initialValue }, new Set()]);

    const rootOptic = new Optic<T, total, Store<T>>([
        {
            key: keySymbol,
            get: (s) => {
                return s.state;
            },
            set: (a, s) => ({
                ...s,
                state: a,
            }),
        } as Lens<T, Store<T>>,
    ]);
    return rootOptic;
}
