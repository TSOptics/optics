import { ContextualMethods } from '../ContextualMethods';
import { PureOptic } from '../PureOptic';
import {
    ComposeScopes,
    DeriveOpticScope,
    FocusedValue,
    OpticScope,
    PartialLens,
    TotalLens,
    partial,
    total,
} from '../types';

export interface _DataOptic<A, TScope extends OpticScope = total, S = any> {
    get(): FocusedValue<A, TScope>;
    set(a: A | ((prev: A) => A)): DataOptic<S, total, S>;

    derive<B>(lens: PartialLens<B, NonNullable<A>>): DataOptic<B, TScope extends partial ? partial : TScope, S>;
    derive<B>(lens: TotalLens<B, NonNullable<A>>): DataOptic<B, DeriveOpticScope<A, TScope>, S>;
    derive<B, TScopeB extends OpticScope>(
        other: PureOptic<B, TScopeB, NonNullable<A>>,
    ): DataOptic<B, ComposeScopes<TScope, TScopeB, A>, S>;
}

export const tag: unique symbol = Symbol('DataOptic tag');

export type Tag<A, TScope extends OpticScope, S> = {
    [tag]: [scope: TScope, root: S, invariance: (a: A) => void];
};

type DeriveFromProps<A, TScope extends OpticScope, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: DataOptic<T[P], DeriveOpticScope<A, TScope>, S>;
      }
    : {};

export type DataOptic<A, TScope extends OpticScope = total, S = any> = _DataOptic<A, TScope, S> &
    DeriveFromProps<A, TScope, S> &
    ContextualMethods<A, TScope, S> &
    Tag<A, TScope, S>;
