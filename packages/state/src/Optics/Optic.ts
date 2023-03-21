import { DeriveOpticType, OpticType, total } from '@optix/core/src/types';
import { CombinatorsForOptic } from '../combinators';
import { _ReadOptic } from './ReadOptic';

type OpticDeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: Optic<T[P], DeriveOpticType<A, TOpticType>, S>;
      }
    : {};

export type _Optic<A, TOpticType extends OpticType, S> = _ReadOptic<A, TOpticType, S> & {
    set(a: A | ((prev: A) => A)): void;
};

export type Optic<A, TOpticType extends OpticType = total, S = any> = _Optic<A, TOpticType, S> &
    OpticDeriveFromProps<A, TOpticType, S> &
    CombinatorsForOptic<A, TOpticType, S>;
