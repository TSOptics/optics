import CombinatorsImpl from './combinators.impl';
import { get } from './get';
import { proxify } from './proxify';
import { _PureOptic, PureOptic } from './PureOptic';
import { PureReadOptic, tag } from './PureReadOptic';
import { set } from './set';
import { DeriveOpticScope, FocusedValue, Lens, OpticScope } from './types';

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

    derive<B>(lens: {
        get: (a: NonNullable<A>) => B;
        set: (b: B, a: NonNullable<A>) => NonNullable<A>;
        key?: string;
    }): PureOptic<B, DeriveOpticScope<A, TScope>, S>;
    derive<B>(lens: { get: (a: NonNullable<A>) => B; key?: string }): PureReadOptic<B, DeriveOpticScope<A, TScope>, S>;
    derive({ get, set, key }: { get: any; set?: any; key?: string }): any {
        return this.instantiate([
            {
                get,
                set: set ?? ((b, a) => a),
                key: key ?? 'derive',
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
