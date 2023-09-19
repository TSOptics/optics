import CombinatorsImpl from './combinators.impl';
import { get } from './get';
import { proxify } from './proxify';
import { _PureOptic, PureOptic } from './PureOptic';
import { PureReadOptic, tag } from './PureReadOptic';
import { set } from './set';
import {
    DeriveOpticScope,
    FocusedValue,
    FoldLens,
    FoldNLens,
    Lens,
    mapped,
    OpticScope,
    partial,
    PartialLens,
    TotalLens,
} from './types';

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

    derive<B>(lens: PartialLens<B, NonNullable<A>>): PureOptic<B, TScope extends partial ? partial : TScope, S>;
    derive<B>(lens: TotalLens<B, NonNullable<A>>): PureOptic<B, DeriveOpticScope<A, TScope>, S>;
    derive<B>(lens: { get: (a: NonNullable<A>) => B; key?: string }): PureReadOptic<B, DeriveOpticScope<A, TScope>, S>;
    derive(lens: TScope extends mapped ? FoldLens<NonNullable<A>> : never): PureOptic<A, partial, S>;
    derive(lens: TScope extends mapped ? FoldNLens<NonNullable<A>> : never): PureOptic<A, mapped, S>;
    derive({ get, set, key, type }: { get: any; set?: any; key?: string; type?: Lens['type'] }): any {
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
