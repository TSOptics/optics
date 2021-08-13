import React, { createContext, ReactElement, ReactNode } from 'react';
import { optix } from '../lens';

type Subscriptions = Set<(root: any) => void>;
type Store = { root: { ref: any }; setRoot: (root: any) => void; subscriptions: Subscriptions };

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
    const provideStore = (jsx: ReactElement) => <Provider store={store}>{jsx}</Provider>;
    const onRoot = optix<T>();

    return { store, provideStore, onRoot };
}
