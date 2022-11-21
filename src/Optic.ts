import { BaseOptic } from './BaseOptic';
import { FocusedValue, GetStateOptions, Lens, OpticType, SubscribeOptions, total } from './types';
import { Store, stores } from './Store';

export class Optic<A, TOpticType extends OpticType = total, S = any> extends BaseOptic<A, TOpticType, S> {
    private storeId: Optic<any, TOpticType, S>;
    private listenersDenormalized = new Set<() => void>();

    private _dependencies?: Dependencies | null;
    private get dependencies() {
        if (this._dependencies === undefined) {
            this._dependencies = this.getDependencies(this.get(this.getStore().state)) ?? null;
        }
        return this._dependencies === null ? undefined : this._dependencies;
    }

    constructor(lenses: Lens[], private initialValue: S, _storeId?: Optic<any, TOpticType, S>) {
        super(lenses);
        this.storeId = _storeId ?? this;
    }

    private cache: { s?: any; a?: any } = {};
    private cacheDenormalize: { s?: any; a?: any; denormalizedA?: any } = {};
    getState = <TOptions extends GetStateOptions | undefined>(
        options?: TOptions,
    ): ResolvedType<A, TOpticType, TOptions> => {
        const denormalize = options?.denormalize === false ? false : !!this.dependencies;
        const store = this.getStore();
        if (denormalize && this.dependencies) {
            const a =
                store.state === this.cacheDenormalize.s && this.cacheDenormalize.a !== undefined
                    ? this.cacheDenormalize.a
                    : this.get(store.state);
            const dependenciesChanged = this.updateDependenciesStates(this.dependencies, a);
            if (
                a === this.cacheDenormalize.a &&
                !dependenciesChanged &&
                this.cacheDenormalize.denormalizedA !== undefined
            ) {
                return this.cacheDenormalize.denormalizedA;
            }
            const denormalizedA = this.denormalizeState(a, this.dependencies);
            this.cacheDenormalize = { s: store.state, a, denormalizedA };
            return denormalizedA;
        }

        if (store.state === this.cache.s && this.cache.a !== undefined) {
            return this.cache.a;
        }
        const a = this.get(store.state);
        this.cache = { s: store.state, a };
        return a as any;
    };

    setState = (a: A | ((prev: A) => A)) => {
        const store = this.getStore();
        store.state = this.set(a, store.state);
        store.listeners.forEach((listener) => listener(store.state));
    };

    subscribe = <TOptions extends SubscribeOptions | undefined>(
        listener: (a: ResolvedType<A, TOpticType, TOptions>) => void,
        options?: TOptions,
    ) => {
        const denormalize = options?.denormalize === false ? false : !!this.dependencies;
        const store = this.getStore();
        let cachedA = this.getState({ denormalize });
        const stateListener = () => {
            const a = this.getState({ denormalize });
            if (a === cachedA) {
                return;
            }
            cachedA = a;
            listener(a as any);
        };
        const updateDependenciesSubscriptions = () => this.updateDependenciesSubscriptions();
        if (denormalize) {
            if (this.listenersDenormalized.size === 0) {
                updateDependenciesSubscriptions();
                store.listeners.add(updateDependenciesSubscriptions);
            }
            this.listenersDenormalized.add(stateListener);
        }
        store.listeners.add(stateListener);

        return () => {
            store.listeners.delete(stateListener);
            if (denormalize) {
                this.listenersDenormalized.delete(stateListener);
                if (this.listenersDenormalized.size === 0) {
                    store.listeners.delete(updateDependenciesSubscriptions);
                }
            }
        };
    };

    reset: TOpticType extends total ? () => void : never = (() => {
        this.setState(this.get(this.initialValue) as any);
    }) as any;

    protected override derive(newLenses: Lens[]): any {
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

    private denormalizeState = (state: any, dependencies: Dependencies): any => {
        if (isLeaf(dependencies)) {
            return dependencies.state;
        }
        if (Array.isArray(dependencies)) {
            const stateArray = state as Array<any>;
            return dependencies.map((x, i) =>
                x === undefined ? stateArray[i] : this.denormalizeState(stateArray[i], x),
            );
        }
        return Object.entries(dependencies).reduce<Record<string, any>>(
            (acc, [key, value]) => {
                acc[key] = this.denormalizeState(acc[key], value);
                return acc;
            },
            { ...state },
        );
    };

    private getDependencies = (state: any): Dependencies | undefined => {
        if (state instanceof Optic) {
            const leaf: Dependency = {
                optic: state,
                unsubscribe: state.subscribe(() => {
                    this.listenersDenormalized.forEach((listener) => listener());
                }),
                [leafSymbol]: 'leaf',
            };
            return leaf;
        }
        let empty = true;
        if (Array.isArray(state)) {
            const subTree = state.map((x) => {
                const subTree = this.getDependencies(x);
                if (subTree !== undefined) {
                    empty = false;
                }
                return subTree;
            });
            return empty ? undefined : subTree;
        }
        if (typeof state === 'object' && state !== null && !(state instanceof Date)) {
            const subTree = Object.entries(state).reduce<Record<string, any>>((acc, [k, v]) => {
                const subTree = this.getDependencies(v);
                if (subTree !== undefined) {
                    empty = false;
                    acc[k] = subTree;
                }
                return acc;
            }, {});
            return empty ? undefined : subTree;
        }
    };

    private updateDependenciesSubscriptions = () => {
        const aux = (dependencies: Dependencies, state: any) => {
            if (isLeaf(dependencies)) {
                if (dependencies.optic === state) return;
                dependencies.optic = state;
                dependencies.unsubscribe();
                dependencies.unsubscribe = dependencies.optic.subscribe(() => {
                    this.listenersDenormalized.forEach((listener) => listener());
                });
            } else if (Array.isArray(dependencies)) {
                dependencies.forEach((d, i) => {
                    if (d !== undefined) {
                        aux(d, state[i]);
                    }
                });
            } else {
                Object.entries(dependencies).forEach(([key, value]) => {
                    aux(value, state[key]);
                });
            }
        };
        this.dependencies && aux(this.dependencies, this.getState({ denormalize: false }));
    };

    private updateDependenciesStates = (dependencies: Dependencies, state: any) => {
        let changed = false;
        const aux = (dependencies: Dependencies, state: any) => {
            if (isLeaf(dependencies)) {
                const newState = (state as Optic<any>).getState({ denormalize: true });
                if (newState !== dependencies.state) {
                    changed = true;
                }
                dependencies.state = newState;
            } else if (Array.isArray(dependencies)) {
                dependencies.forEach((d, i) => {
                    if (d !== undefined) {
                        aux(d, state[i]);
                    }
                });
            } else {
                Object.entries(dependencies).forEach(([key, value]) => {
                    aux(value, state[key]);
                });
            }
        };
        aux(dependencies, state);
        return changed;
    };
}

declare module './BaseOptic' {
    export interface ResolveClass<TOptic extends BaseOptic<any, OpticType>, A, TOpticType extends OpticType, S> {
        (): TOptic extends Optic<any, OpticType> ? Optic<A, TOpticType, S> : BaseOptic<A, TOpticType, S>;
    }
}

const isLeaf = (dependencies: Dependencies): dependencies is Dependency => dependencies.hasOwnProperty(leafSymbol);

type Denormalized<T> = T extends Optic<infer R, infer OpticType>
    ? Denormalized<FocusedValue<R, OpticType>>
    : T extends Date
    ? T
    : T extends Record<string, any>
    ? { [P in keyof T]: Denormalized<T[P]> } extends infer SubTree
        ? T extends SubTree
            ? T
            : SubTree
        : never
    : T;

export type ResolvedType<
    T,
    TOpticType extends OpticType,
    TOptions extends { denormalize?: boolean } | undefined,
    TFocusedValue = FocusedValue<T, TOpticType>,
    TDenormalized = Denormalized<TFocusedValue>,
> = undefined extends TOptions
    ? TDenormalized
    : NonNullable<TOptions>['denormalize'] extends infer denormalize
    ? denormalize extends false
        ? TFocusedValue
        : TDenormalized
    : never;

const leafSymbol: unique symbol = Symbol('dependency');

type Dependency = {
    state?: any;
    optic: Optic<any, OpticType>;
    unsubscribe: () => void;
    readonly [leafSymbol]: 'leaf';
};

type Dependencies = Array<Dependencies | undefined> | { [key: string]: Dependencies } | Dependency;
