import { OpticScope, total, DeriveOpticScope } from '@optics/core';
import { CombinatorsForOptic } from '../combinators';
import { _ReadOptic } from './ReadOptic';

type OpticDeriveFromProps<A, TScope extends OpticScope, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: Optic<T[P], DeriveOpticScope<A, TScope>>;
      }
    : {};

export interface _Optic<A, TScope extends OpticScope> extends _ReadOptic<A, TScope> {
    set(a: A | ((prev: A) => A)): void;
}

export type Optic<A, TScope extends OpticScope = total> = _Optic<A, TScope> &
    OpticDeriveFromProps<A, TScope> &
    CombinatorsForOptic<A, TScope>;
