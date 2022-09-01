import { Optic } from '../Optic';
import { FocusedValue, Lens, OpticType, total } from '../types';
import { Store, stores } from './Store';

export class StoreOptic<A, TOpticType extends OpticType = total, S = any> extends Optic<A, TOpticType, S> {
    private storeId: StoreOptic<any, TOpticType, S>;
    constructor(lenses: Lens[], private initialValue: S, _storeId?: StoreOptic<any, TOpticType, S>) {
        super(lenses);
        this.storeId = _storeId ?? this;
    }

    protected override derive(newLenses: Lens[]) {
        return new StoreOptic([...this.lenses, ...newLenses], this.initialValue, this.storeId);
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

    getState = (): FocusedValue<A, TOpticType> => {
        const store = this.getStore();
        return this.get(store.state);
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
}

declare module '../Optic' {
    export interface ResolveClass<TOptic extends Optic<any, OpticType>, A, TOpticType extends OpticType, S> {
        (): TOptic extends StoreOptic<any, OpticType> ? StoreOptic<A, TOpticType, S> : Optic<A, TOpticType, S>;
    }
}
