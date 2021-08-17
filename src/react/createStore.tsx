import React, { createContext, ReactElement, ReactNode } from 'react';
import { Optix, optix, total } from '../lens';
import { isObject } from '../utils';

type Subscriptions = Set<(root: any) => void>;
type Store = { root: { ref: any }; setRoot: (root: any) => void; subscriptions: Subscriptions };
type RootKeyOptix<T> = T extends Record<string, unknown>
    ? {
          [Key in keyof T as `on${Capitalize<Key & string>}`]: Optix<T[Key], total, T>;
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
        subscriptions.forEach((subscriber) => subscriber(newRoot));
    };
    const store: Store = { root, subscriptions, setRoot };
    const provideStore = (jsx: ReactNode) => <Provider store={store}>{jsx}</Provider>;
    const onRoot = optix<T>();
    const rootKeysOptix: RootKeyOptix<T> = isObject(initialState)
        ? (Object.fromEntries(
              Object.keys(initialState).map((key) => [
                  `on${key.replace(/^\w/, (c) => c.toUpperCase())}`,
                  optix<typeof initialState>().focus(key),
              ]),
          ) as any)
        : {};

    return { store, provideStore, onRoot, setRoot, ...rootKeysOptix };
}
