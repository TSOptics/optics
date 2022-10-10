import { BaseOptic } from './BaseOptic';
import { FocusedValue, GetStateOptions, Lens, OpticType, total } from './types';
import { Store, stores } from './Store';

export class Optic<A, TOpticType extends OpticType = total, S = any> extends BaseOptic<A, TOpticType, S> {
    private storeId: Optic<any, TOpticType, S>;

    constructor(lenses: Lens[], private initialValue: S, _storeId?: Optic<any, TOpticType, S>) {
        super(lenses);
        this.storeId = _storeId ?? this;
        this.storeDependencies = this.getStoreDependencies(this.get(this.getStore().state));
    }

    private sCache: any;
    private aCache: { denormalized: boolean; value: any } | undefined;
    getState = <TOptions extends GetStateOptions>(
        options?: TOptions,
    ): TOptions extends { denormalize: false }
        ? FocusedValue<A, TOpticType>
        : Denormalize<FocusedValue<A, TOpticType>> => {
        const { denormalize = true } = options ?? {};
        const store = this.getStore();
        const denormalized = this.storeDependencies !== undefined && denormalize;
        if (
            store.state === this.sCache &&
            this.aCache &&
            this.aCache.denormalized === denormalized &&
            (!denormalized || !this.didDependenciesChange(this.storeDependencies ?? null))
        ) {
            return this.aCache.value;
        }

        const a = denormalized
            ? this.denormalizeState(this.get(store.state), this.storeDependencies ?? null)
            : this.get(store.state);
        this.sCache = store.state;
        this.aCache = { denormalized, value: a };
        return a;
    };

    setState = (a: A | ((prev: A) => A)) => {
        const store = this.getStore();
        store.state = this.set(a, store.state);
        store.listeners.forEach((listener) => listener(store.state));
    };

    subscribe = (listener: (a: FocusedValue<A, TOpticType>) => void) => {
        const store = this.getStore();
        const stateListener = (s: S) => listener(this.get(s));
        store.listeners.add(stateListener);
        return () => {
            store.listeners.delete(stateListener);
        };
    };

    protected override derive(newLenses: Lens[]) {
        return new Optic([...this.lenses, ...newLenses], this.initialValue, this.storeId);
    }

    private getStore(): Store<S> {
        const store = stores.get(this.storeId);
        if (!store) {
            const newStore: Store<S> = { state: this.initialValue, listeners: new Set() };
            stores.set(this.storeId, newStore);
            return newStore;
        }
        return store;
    }

    private storeDependencies?: StoreDependencies;
    private getStoreDependencies(state: any): StoreDependencies | undefined {
        if (state instanceof Optic) return null;
        let empty = true;
        if (Array.isArray(state)) {
            const subTree = state.map((x) => {
                const subTree = this.getStoreDependencies(x);
                if (subTree !== undefined) {
                    empty = false;
                }
                return subTree;
            });
            return empty ? undefined : subTree;
        }
        if (typeof state === 'object' && state !== null && !(state instanceof Date)) {
            const subTree = Object.entries(state).reduce<Record<string, any>>((acc, [k, v]) => {
                const subTree = this.getStoreDependencies(v);
                if (subTree !== undefined) {
                    empty = false;
                    acc[k] = subTree;
                }
                return acc;
            }, {});
            return empty ? undefined : subTree;
        }
        return undefined;
    }

    private cachedDependencies: Map<Optic<any>, any> = new Map();
    private didDependenciesChange = (storeDependencies: StoreDependencies): any => {
        const dependencies = new Map<Optic<any>, any>();
        const aux = (state: any, storeDependencies: StoreDependencies) => {
            if (storeDependencies === null) {
                const optic = state as Optic<any>;
                dependencies.set(optic, optic.getState());
            } else if (Array.isArray(storeDependencies)) {
                const stateArray = state as Array<any>;
                storeDependencies.forEach((x, i) => {
                    if (x !== undefined) aux(stateArray[i], x);
                });
            } else {
                Object.entries(storeDependencies).forEach(([key, value]) => {
                    aux((state as Record<string, any>)[key], value);
                });
            }
        };
        aux(this.get(this.getStore().state), storeDependencies);
        const didChange =
            dependencies.size !== this.cachedDependencies.size ||
            Array.from(dependencies.entries()).some(([optic, value]) => this.cachedDependencies.get(optic) !== value);
        this.cachedDependencies = dependencies;

        return didChange;
    };

    private denormalizeState = (state: any, storeDependencies: StoreDependencies): any => {
        if (storeDependencies === null) {
            return (state as Optic<any>).getState();
        }
        if (Array.isArray(storeDependencies)) {
            const stateArray = state as Array<any>;
            return storeDependencies.map((x, i) =>
                x === undefined ? stateArray[i] : this.denormalizeState(stateArray[i], x),
            );
        }
        return Object.entries(storeDependencies).reduce<Record<string, any>>(
            (acc, [key, value]) => {
                acc[key] = this.denormalizeState(acc[key], value);
                return acc;
            },
            { ...state },
        );
    };
}

declare module './BaseOptic' {
    export interface ResolveClass<TOptic extends BaseOptic<any, OpticType>, A, TOpticType extends OpticType, S> {
        (): TOptic extends Optic<any, OpticType> ? Optic<A, TOpticType, S> : BaseOptic<A, TOpticType, S>;
    }
}

export type Denormalize<T> = T extends Optic<infer R, infer OpticType>
    ? FocusedValue<R, OpticType>
    : T extends Date
    ? T
    : T extends Record<string, any>
    ? { [P in keyof T]: Denormalize<T[P]> } extends infer SubTree
        ? T extends SubTree
            ? T
            : SubTree
        : never
    : T;

type StoreDependencies = Array<StoreDependencies | undefined> | { [key: string]: StoreDependencies } | null;

type FlattenOptics<T, Path extends string = '', IsUnion extends boolean = false, OriginalT = T> = T extends Optic<any>
    ? { [K in Path as `${K}`]: [OriginalT] extends [T] ? IsUnion : true }
    : T extends Record<string, any>
    ? Exclude<keyof T, keyof any[]> extends infer Keys
        ? [Keys] extends [never]
            ? [T] extends [any[]]
                ? FlattenOptics<
                      T[number],
                      `${Path}${Path extends '' ? '' : '.'}map`,
                      [OriginalT] extends [T] ? IsUnion : true
                  >
                : never
            : Keys extends string
            ? FlattenOptics<
                  T[Keys],
                  `${Path}${Path extends '' ? '' : '.'}${Keys}`,
                  [OriginalT] extends [T] ? IsUnion : true
              >
            : never
        : never
    : never;

type RequiredOptics<T> = FlattenOptics<T> extends infer U
    ? { [P in keyof U as U[P] extends false ? P : never]: U[P] }
    : never;

type OptionalOptics<T> = FlattenOptics<T> extends infer U
    ? { [P in keyof U as U[P] extends true ? P : never]: U[P] }
    : never;

type UnionToIntersection<T> = (T extends any ? (t: T) => void : never) extends (t: infer U) => void ? U : never;
