import CombinatorsImpl from './combinators.impl';
import { get } from './get';
import { proxify } from './proxify';
import { _PureOptic, PureOptic } from './PureOptic';
import { PureReadOptic, tag } from './PureReadOptic';
import { set } from './set';
import { DeriveOpticType, FocusedValue, Lens, OpticType } from './types';

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

    derive<B>(get: (a: NonNullable<A>) => B): PureReadOptic<B, DeriveOpticType<A, TOpticType>, S>;
    derive<B>(
        get: (a: NonNullable<A>) => B,
        set: (b: B, a: NonNullable<A>) => NonNullable<A>,
    ): PureOptic<B, DeriveOpticType<A, TOpticType>, S>;
    derive(get: any, set?: any): any {
        return this.instantiate([
            {
                get,
                set: set ?? ((b, a) => a),
                key: 'derive',
                type: 'unstable',
            },
        ]);
    }

    protected instantiate(newLenses: Lens[]): any {
        return new PureOpticImpl([...this.lenses, ...newLenses]);
    }
    private toString(): string {
        return this.lenses.map((l) => l.key.toString()).toString();
    }
}

export default PureOpticImpl;
