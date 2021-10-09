import React, { createContext, FC, MutableRefObject, useRef } from 'react';
import { Lens, Optic, total } from '..';

type Subscriptions = Set<MutableRefObject<(root: any) => void>>;
export type Store<T = any> = { root: T; subscriptions: Subscriptions };
export type Stores = Map<Record<string, never>, Store>;
export const rootOpticSymbol = Symbol('rootOptic');

export function createStore<T>(initialValue: T, key?: string) {
    const id = {};
    const rootOptic = new Optic<T, total, Stores>([
        {
            key: rootOpticSymbol,
            get: (s) => {
                if (!s.has(id)) {
                    s.set(id, { root: initialValue, subscriptions: new Set() });
                }
                return s.get(id) as Store<T>;
            },
            set: (a, s) => {
                s.set(id, a);
                s.get(id)!.subscriptions.forEach((subscriber) => subscriber.current(s));
                return s;
            },
        } as Lens<Store<T>, Stores>,
        {
            key: key ?? 'store',
            get: (s) => {
                return s.root;
            },
            set: (a, s) => ({
                ...s,
                root: a,
            }),
        },
    ]);
    return rootOptic;
}
export const OptixStoresContext = createContext<Stores>(new Map());

export const Provider: FC = ({ children }) => {
    return <OptixStoresContext.Provider value={useRef(new Map()).current}>{children}</OptixStoresContext.Provider>;
};
