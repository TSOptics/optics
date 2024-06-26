import { get, proxify, set, FocusedValue, Lens, ReduceValue, partial, mapped } from '@optics/core';
import { Store, stores } from './stores';
import { GetStateOptions, Modifiers, SubscribeOptions } from './types';
import { ArrayOptic, MappedOptic, WriteOptic } from './ContextualMethods';
import { _Optic, Denormalized, Dependencies, Dependency, leafSymbol, Optic, ResolvedType } from './Optics/Optic';

class OpticImpl<A, TModifiers extends Modifiers = {}>
    implements ArrayOptic<A, TModifiers>, MappedOptic<A, TModifiers>, WriteOptic<A>, _Optic<A, TModifiers>
{
    protected lenses: Lens<any, any>[];
    private storeId: OpticImpl<any>;
    private listenersDenormalized = new Set<() => void>();

    private _dependencies?: Dependencies | null;
    private get dependencies() {
        if (this._dependencies === undefined) {
            this._dependencies = this.getDependencies(get(this.getStore().state, this.lenses)) ?? null;
        }
        return this._dependencies;
    }

    constructor(lenses: Lens[], private initialValue: any, _storeId?: OpticImpl<any>) {
        this.lenses = lenses;
        this.storeId = _storeId ?? (this as any);
        return proxify(this);
    }

    private lensesCache = new Map<Lens, any>();
    private cache: {
        result?: FocusedValue<A, TModifiers>;
        normalized?: FocusedValue<A, TModifiers>;
        denormalized?: Denormalized<FocusedValue<A, TModifiers>>;
    } = {};

    get(): FocusedValue<A, TModifiers>;
    get<TOptions extends GetStateOptions>(options: TOptions): ResolvedType<A, TModifiers, TOptions>;
    get<TOptions extends GetStateOptions>(options?: TOptions): ResolvedType<A, TModifiers, TOptions> {
        const denormalize = options?.denormalize === true ? !!this.dependencies : false;
        const store = this.getStore();
        const result = get<A, TModifiers>(store.state, this.lenses, {
            lenses: this.lensesCache,
            result: this.cache.result,
        });
        if (!denormalize || !this.dependencies) {
            this.cache.result = result;
            return result as any;
        }
        const dependenciesChanged = this.updateDependenciesStates(this.dependencies, result);
        if (!dependenciesChanged && this.cache.normalized === result && this.cache.denormalized !== undefined) {
            return this.cache.denormalized as any;
        }
        const denormalizedResult = this.denormalizeState(result, this.dependencies);
        this.cache = { normalized: result, denormalized: denormalizedResult };
        return denormalizedResult;
    }

    set(a: A | ((prev: A) => A)) {
        const store = this.getStore();
        store.state = set(a, store.state, this.lenses);
        store.listeners.forEach((listener) => listener(store.state));
    }

    subscribe(listener: (a: FocusedValue<A, TModifiers>) => void): () => void;
    subscribe<TOptions extends SubscribeOptions>(
        listener: (a: ResolvedType<A, TModifiers, TOptions>) => void,
        options: TOptions,
    ): () => void;
    subscribe<TOptions extends SubscribeOptions>(
        listener: (a: FocusedValue<A, TModifiers>) => void,
        options?: TOptions,
    ): () => void {
        const denormalize = options?.denormalize === true ? !!this.dependencies : false;
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

    derive(other: any): any {
        if (Array.isArray(other.lenses)) {
            return this.instantiate([...other.lenses]);
        }
        const { get, set, key, type } = other;
        return this.instantiate([
            {
                get,
                set: set ?? ((b, a) => a),
                key: key ?? 'derive',
                type: type ?? 'unstable',
            },
        ]);
    }

    map<Elem = A extends (infer R)[] ? R : never>(): Optic<Elem, TModifiers & mapped> {
        return this.instantiate([{ get: (s) => s, set: (a) => a, key: 'map', type: 'map' }]);
    }

    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>[]): Optic<A, TModifiers & mapped>;
    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>): Optic<A, Omit<TModifiers, 'map'> & partial>;
    reduce(reducer: any): Optic<A, Omit<TModifiers, 'map'> & partial> | Optic<A, TModifiers & mapped> {
        return this.instantiate([{ get: reducer, set: () => {}, key: 'reduce', type: 'fold' }]);
    }

    protected instantiate(newLenses: Lens[]): any {
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
                unsubscribe: state.subscribe(
                    () => {
                        this.listenersDenormalized.forEach((listener) => listener());
                    },
                    { denormalize: true },
                ),
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
                dependencies.unsubscribe = dependencies.optic.subscribe(
                    () => {
                        this.listenersDenormalized.forEach((listener) => listener());
                    },
                    { denormalize: true },
                );
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
                const newState = (state as _Optic<any, Modifiers>).get({ denormalize: true });
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

    private toString(): string {
        return `${this.lenses.map((l) => l.key ?? 'lens').toString()}`;
    }
}

const isLeaf = (dependencies: Dependencies): dependencies is Dependency => dependencies.hasOwnProperty(leafSymbol);

export default OpticImpl;
