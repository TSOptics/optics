import { OpticType, total, DeriveOpticType } from '@optics/core';
import { CombinatorsForOptic } from '../combinators';
import { _ReadOptic } from './ReadOptic';

type OpticDeriveFromProps<A, TOpticType extends OpticType, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: Optic<T[P], DeriveOpticType<A, TOpticType>>;
      }
    : {};

export interface _Optic<A, TOpticType extends OpticType> extends _ReadOptic<A, TOpticType> {
    set(a: A | ((prev: A) => A)): void;
}

export type Optic<A, TOpticType extends OpticType = total> = _Optic<A, TOpticType> &
    OpticDeriveFromProps<A, TOpticType> &
    CombinatorsForOptic<A, TOpticType>;
