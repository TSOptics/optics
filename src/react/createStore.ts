import { Optic } from '../Optic';
import { Lens, total } from '../types';

type Listener = (root: any) => void;
export type Store<T = any> = { root: T; subscribe: (Listener: Listener) => () => void };
export type Stores = Map<Record<string, never>, Store>;
export const rootOpticSymbol = Symbol('rootOptic');

function createStore<T>(initialValue: T, key?: string) {
    const id = {};
    const subscriptions: Set<Listener> = new Set();
    const subscribe = (listener: Listener) => {
        subscriptions.add(listener);
        return () => {
            subscriptions.delete(listener);
        };
    };
    const rootOptic = new Optic<T, total, Stores>([
        {
            key: rootOpticSymbol,
            get: (s) => {
                if (!s.has(id)) {
                    s.set(id, { root: initialValue, subscribe });
                }
                return s.get(id) as Store<T>;
            },
            set: (a, s) => {
                s.set(id, a);
                subscriptions.forEach((subscriber) => subscriber(s));
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

export default createStore;
