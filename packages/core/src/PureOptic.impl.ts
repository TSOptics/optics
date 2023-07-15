import CombinatorsImpl from './combinators.impl';
import { get } from './get';
import { proxify } from './proxify';
import { _PureOptic } from './PureOptic';
import { tag } from './PureReadOptic';
import { set } from './set';
import { FocusedValue, Lens, OpticType } from './types';

class PureOpticImpl<A, TOpticType extends OpticType, S>
    extends CombinatorsImpl<A, TOpticType, S>
    implements Omit<_PureOptic<A, TOpticType, S>, typeof tag>
{
    protected lenses: Lens[];
    constructor(lenses: Lens[]) {
        super();
        this.lenses = lenses;
        return proxify(this);
    }

    get(s: S): FocusedValue<A, TOpticType> {
        return get(s, this.lenses);
    }

    set(a: A | ((prev: A) => A), s: S): S {
        return set(a, s, this.lenses);
    }

    protected derive(newLenses: Lens[]): any {
        return new PureOpticImpl([...this.lenses, ...newLenses]);
    }
    private toString(): string {
        return this.lenses.map((l) => l.key.toString()).toString();
    }
}

export default PureOpticImpl;
