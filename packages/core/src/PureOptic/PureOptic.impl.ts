import { ArrayOptic, MappedOptic, Resolve, WriteOptic } from '../ContextualMethods';
import { get } from '../get';
import { proxify } from '../proxify';
import { _PureOptic } from '../PureOptic/PureOptic';
import { ReduceValue, set } from '../set';
import { FocusedValue, Lens, mapped, Modifiers, partial } from '../types';

class PureOpticImpl<A, TModifiers extends Modifiers, S>
    implements
        _PureOptic<A, TModifiers, S>,
        MappedOptic<A, TModifiers, S>,
        ArrayOptic<any, TModifiers, S>,
        WriteOptic<A, S>
{
    protected lenses: Lens[];
    constructor(lenses: Lens[]) {
        this.lenses = lenses;
        return proxify(this);
    }

    get(s: S): FocusedValue<A, TModifiers> {
        return get(s, this.lenses);
    }

    set(a: A | ((prev: A) => A), s: S): S {
        return set(a, s, this.lenses);
    }

    derive(other: any): any {
        if (other instanceof PureOpticImpl) {
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

    map<Elem = A extends (infer R)[] ? R : never>(): Resolve<this, Elem, TModifiers & mapped, S> {
        return this.instantiate([{ get: (s) => s, set: (a) => a, key: 'map', type: 'map' }]);
    }

    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>[]): Resolve<this, A, TModifiers & mapped, S>;
    reduce(
        reducer: (values: ReduceValue<A>[]) => ReduceValue<A>,
    ): Resolve<this, A, Omit<TModifiers, 'mapped'> & partial, S>;
    reduce(
        reducer: any,
    ): Resolve<this, A, TModifiers & mapped, S> | Resolve<this, A, Omit<TModifiers, 'mapped'> & partial, S> {
        return this.instantiate([{ get: reducer, set: noop, key: 'reduce', type: 'fold' }]);
    }

    protected instantiate(newLenses: Lens[]): any {
        return new PureOpticImpl([...this.lenses, ...newLenses]);
    }
    private toString(): string {
        return this.lenses.map((l) => l.key ?? 'lens').toString();
    }
}

const noop = () => {};

export default PureOpticImpl;
