import CombinatorsImpl from './combinators.impl';
import { get } from './get';
import { proxify } from './proxify';
import { _PureOptic } from './PureOptic';
import { tag } from './PureReadOptic';
import { set } from './set';
import { FocusedValue, Lens, OpticScope } from './types';

class PureOpticImpl<A, TScope extends OpticScope, S>
    extends CombinatorsImpl<A, TScope, S>
    implements Omit<_PureOptic<A, TScope, S>, typeof tag>
{
    protected lenses: Lens[];
    constructor(lenses: Lens[]) {
        super();
        this.lenses = lenses;
        return proxify(this);
    }

    get(s: S): FocusedValue<A, TScope> {
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

    protected instantiate(newLenses: Lens[]): any {
        return new PureOpticImpl([...this.lenses, ...newLenses]);
    }
    private toString(): string {
        return this.lenses.map((l) => l.key ?? 'lens').toString();
    }
}

export default PureOpticImpl;
