import React, { createContext, MutableRefObject, ReactNode } from 'react';
import { Optic, optic, total } from '../lens';
import { isObject } from '../utils';

type Subscriptions = Set<MutableRefObject<(root: any) => void>>;
type Store = { root: { ref: any }; setRoot: (root: any) => void; subscriptions: Subscriptions };
type RootKeyOptic<T> = T extends Record<string, unknown>
    ? {
          [Key in keyof T as `on${Capitalize<Key & string>}`]: Optic<T[Key], total, T>;
      }
    : Record<string, never>;

export const StoreContext = createContext<Store>({
    subscriptions: new Set(),
    root: { ref: undefined },
    setRoot: () => {
        // noop
    },
});

export const Provider = ({ store, children }: { store: Store; children: ReactNode }) => {
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export default function createStore<T>(initialState: T) {
    const subscriptions: Subscriptions = new Set();
    const root = { ref: initialState };
    const setRoot = (newRoot: any) => {
        root.ref = newRoot;
        subscriptions.forEach((subscriber) => subscriber.current(newRoot));
    };
    const store: Store = { root, subscriptions, setRoot };
    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;
    const onRoot = optic<T>();
    const rootKeysOptic: RootKeyOptic<T> = isObject(initialState)
        ? (Object.fromEntries(
              Object.keys(initialState).map((key) => [
                  `on${key.replace(/^\w/, (c) => c.toUpperCase())}`,
                  optic<typeof initialState>().focus(key),
              ]),
          ) as any)
        : {};

    return { store, wrapper, onRoot, setRoot, ...rootKeysOptic };
}
