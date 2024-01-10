import { ArrayOptic, MappedOptic, Resolve } from '../ContextualMethods';
import { DataOptic, _DataOptic } from './DataOptic';
import PureOpticImpl from '../PureOptic/PureOptic.impl';
import { get } from '../get';
import { proxify } from '../proxify';
import { ReduceValue, set } from '../set';
import { FocusedValue, Lens, Modifiers, mapped, partial } from '../types';

class DataOpticImpl<A, TModifiers extends Modifiers, S>
    implements _DataOptic<A, TModifiers, S>, ArrayOptic<A, TModifiers, S>, MappedOptic<A, TModifiers, S>
{
    protected lenses: Lens[];
    constructor(lenses: Lens[], private value: S) {
        this.lenses = lenses;
        return proxify(this);
    }

    get(): FocusedValue<A, TModifiers> {
        return get(this.value, this.lenses);
    }

    set(a: A | ((prev: A) => A)): DataOptic<S, {}, S> {
        const newValue = set(a, this.value, this.lenses);
        return new DataOpticImpl([this.lenses[0]], newValue) as any;
    }

    derive(other: any): any {
        if (other instanceof PureOpticImpl) {
            return this.instantiate(other['lenses']);
        }
        const { get, set, key, type } = other;
        return this.instantiate([
            {
                get,
                set: set ?? ((_, s) => s),
                key: key ?? 'derive',
                type: type ?? 'unstable',
            },
        ]);
    }
    map<Elem = A extends (infer R)[] ? R : never>(): Resolve<this, Elem, mapped, S> {
        return this.instantiate([{ get: (s) => s, set: (a) => a, key: 'map', type: 'map' }]);
    }

    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>[]): Resolve<this, A, mapped, S>;
    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>): Resolve<this, A, partial, S>;
    reduce(reducer: any): Resolve<this, A, partial, S> | Resolve<this, A, mapped, S> {
        return this.instantiate([{ get: reducer, set: () => {}, key: 'reduce', type: 'fold' }]);
    }

    protected instantiate(newLenses: Lens[]): any {
        return new DataOpticImpl([...this.lenses, ...newLenses], this.value);
    }
    private toString(): string {
        return this.lenses.map((l) => l.key ?? 'lens').toString();
    }
}

export default DataOpticImpl;
