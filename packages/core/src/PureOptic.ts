import { PureReadOptic, _PureReadOptic } from './PureReadOptic';
import { CombinatorsForOptic } from './combinators.types';
import { DeriveOpticScope, OpticScope, total } from './types';

export interface _PureOptic<A, TScope extends OpticScope = total, S = any> extends _PureReadOptic<A, TScope, S> {
    set(a: A | ((prev: A) => A), s: S): S;
    derive<B>(get: (a: NonNullable<A>) => B): PureReadOptic<B, DeriveOpticScope<A, TScope>, S>;
    derive<B>(
        get: (a: NonNullable<A>) => B,
        set: (b: B, a: NonNullable<A>) => NonNullable<A>,
    ): PureOptic<B, DeriveOpticScope<A, TScope>, S>;
}

type DeriveFromProps<A, TScope extends OpticScope, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureOptic<T[P], DeriveOpticScope<A, TScope>, S>;
      }
    : {};

export type PureOptic<A, TScope extends OpticScope = total, S = any> = _PureOptic<A, TScope, S> &
    DeriveFromProps<A, TScope, S> &
    CombinatorsForOptic<A, TScope, S>;
