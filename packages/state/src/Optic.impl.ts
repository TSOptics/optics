import { CombinatorsImpl, get, proxify, set, FocusedValue, Lens, OpticType } from '@optics/core';
import { TotalCombinators } from './combinators';
import { _Optic } from './Optics/Optic';
import { Denormalized, Dependencies, Dependency, leafSymbol, ResolvedType, tag } from './Optics/ReadOptic';
import { Store, stores } from './stores';
import { GetStateOptions, SubscribeOptions } from './types';
class OpticImpl<A, TOpticType extends OpticType>
    extends CombinatorsImpl<A, TOpticType, any>
    implements Omit<_Optic<A, TOpticType>, typeof tag>, TotalCombinators
{
    protected lenses: Lens<any, any>[];
    private storeId: OpticImpl<any, OpticType>;
    private listenersDenormalized = new Set<() => void>();

    private _dependencies?: Dependencies | null;
    private get dependencies() {
        if (this._dependencies === undefined) {
            this._dependencies = this.getDependencies(get(this.getStore().state, this.lenses)) ?? null;
        }
        return this._dependencies;
    }

    constructor(lenses: Lens[], private initialValue: any, _storeId?: OpticImpl<any, OpticType>) {
        super();
        this.lenses = lenses;
        this.storeId = _storeId ?? (this as any);
        return proxify(this);
    }

    private cacheByLenses = new Map<Lens, any>();
    private cache: {
        a?: FocusedValue<A, TOpticType>;
        normalized?: FocusedValue<A, TOpticType>;
        denormalized?: Denormalized<FocusedValue<A, TOpticType>>;
    } = {};

    get<TOptions extends GetStateOptions | undefined>(
        options?: TOptions | undefined,
    ): ResolvedType<A, TOpticType, TOptions, FocusedValue<A, TOpticType>, Denormalized<FocusedValue<A, TOpticType>>> {
        const denormalize = options?.denormalize === false ? false : !!this.dependencies;
        const store = this.getStore();
        const a = get<A, TOpticType>(store.state, this.lenses, (s, lens) => {
            if (lens.type === 'unstable' || lens.type === 'map') {
                if (this.cacheByLenses.get(lens) === s && this.cache.a !== undefined) {
                    return this.cache.a;
                }
                this.cacheByLenses.set(lens, s);
            }
            return undefined;
        });
        if (!denormalize || !this.dependencies) {
            this.cache.a = a;
            return a as any;
        }
        const dependenciesChanged = this.updateDependenciesStates(this.dependencies, a);
        if (!dependenciesChanged && this.cache.normalized === a && this.cache.denormalized !== undefined) {
            return this.cache.denormalized as any;
        }
        const denormalizedA = this.denormalizeState(a, this.dependencies);
        this.cache = { normalized: a, denormalized: denormalizedA };
        return denormalizedA;
    }

    set(a: A | ((prev: A) => A)) {
        const store = this.getStore();
        store.state = set(a, store.state, this.lenses);
        store.listeners.forEach((listener) => listener(store.state));
    }

    reset(): void {
        this.set(get(this.initialValue, this.lenses) as any);
    }

    subscribe<TOptions extends SubscribeOptions | undefined>(
        listener: (a: ResolvedType<A, TOpticType, TOptions>) => void,
        options?: TOptions,
    ): () => void {
        const denormalize = options?.denormalize === false ? false : !!this.dependencies;
        const store = this.getStore();
        let cachedA = this.get({ denormalize });
        const stateListener = () => {
            const a = this.get({ denormalize });
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
    }

    protected override derive(newLenses: Lens[]): any {
        return new OpticImpl([...this.lenses, ...newLenses], this.initialValue, this.storeId);
    }

    private getStore(): Store {
        const store = stores.get(this.storeId);
        if (!store) {
            const newStore: Store = { state: this.initialValue, listeners: new Set() };
            stores.set(this.storeId, newStore);
            return newStore;
        }
        return store;
    }

    private getDependencies = (state: any): Dependencies | undefined => {
        if (state instanceof OpticImpl) {
            const leaf: Dependency = {
                optic: state as any,
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
        this.dependencies && aux(this.dependencies, this.get({ denormalize: false }));
    };

    private updateDependenciesStates = (dependencies: Dependencies, state: any) => {
        let changed = false;
        const aux = (dependencies: Dependencies, state: any) => {
            if (isLeaf(dependencies)) {
                const newState = (state as _Optic<any, OpticType>).get({ denormalize: true });
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

const isLeaf = (dependencies: Dependencies): dependencies is Dependency => dependencies.hasOwnProperty(leafSymbol);

export default OpticImpl;
