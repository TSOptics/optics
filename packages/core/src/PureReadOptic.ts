import { PureOptic } from './PureOptic';
import { CombinatorsForOptic, Resolve } from './combinators.types';
import {
    ComposeScopes,
    DeriveOpticScope,
    FocusedValue,
    FoldLens,
    FoldNLens,
    MapLens,
    OpticScope,
    PartialLens,
    TotalLens,
    mapped,
    partial,
    total,
} from './types';

export const tag: unique symbol = Symbol('tag');

export interface _PureReadOptic<A, TScope extends OpticScope = total, S = any> {
    get(s: S): FocusedValue<A, TScope>;

    derive<B>(lens: PartialLens<B, NonNullable<A>>): Resolve<this, B, TScope extends partial ? partial : TScope, S>;
    derive<B>(lens: TotalLens<B, NonNullable<A>>): Resolve<this, B, DeriveOpticScope<A, TScope>, S>;
    derive(
        lens: NonNullable<A> extends any[] ? MapLens : never,
    ): NonNullable<A> extends any[] ? Resolve<this, NonNullable<A>[number], mapped, S> : never;
    derive(lens: FoldLens<NonNullable<A>>): Resolve<this, A, partial, S>;
    derive(lens: TScope extends mapped ? FoldNLens<NonNullable<A>> : never): Resolve<this, A, mapped, S>;
    derive<B>(lens: { get: (a: NonNullable<A>) => B; key?: string }): PureReadOptic<B, DeriveOpticScope<A, TScope>, S>;
    derive<B, TScopeB extends OpticScope>(
        other: PureOptic<B, TScopeB, NonNullable<A>>,
    ): Resolve<this, B, ComposeScopes<TScope, TScopeB, A>, S>;
    derive<B, TScopeB extends OpticScope>(
        other: PureReadOptic<B, TScopeB, NonNullable<A>>,
    ): PureReadOptic<B, ComposeScopes<TScope, TScopeB, A>, S>;

    [tag]: [scope: TScope, root: S, invariance: (a: A, s: S) => void];
}

type DeriveFromProps<A, TScope extends OpticScope, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureReadOptic<T[P], DeriveOpticScope<A, TScope>, S>;
      }
    : {};

export type PureReadOptic<A, TScope extends OpticScope = total, S = any> = _PureReadOptic<A, TScope, S> &
    DeriveFromProps<A, TScope, S> &
    CombinatorsForOptic<A, TScope, S>;
