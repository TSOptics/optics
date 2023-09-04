import { CombinatorsForOptic } from './combinators.types';
import { DeriveOpticScope, FocusedValue, OpticScope, total } from './types';

export const tag: unique symbol = Symbol('tag');

export interface _PureReadOptic<A, TScope extends OpticScope = total, S = any> {
    get(s: S): FocusedValue<A, TScope>;
    derive<B>(get: (a: NonNullable<A>) => B): PureReadOptic<B, DeriveOpticScope<A, TScope>, S>;
    [tag]: [opticScope: TScope, root: S, invariance: (a: A, s: S) => void];
}

type DeriveFromProps<A, TScope extends OpticScope, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureReadOptic<T[P], DeriveOpticScope<A, TScope>, S>;
      }
    : {};

export type PureReadOptic<A, TScope extends OpticScope = total, S = any> = _PureReadOptic<A, TScope, S> &
    DeriveFromProps<A, TScope, S> &
    CombinatorsForOptic<A, TScope, S>;
