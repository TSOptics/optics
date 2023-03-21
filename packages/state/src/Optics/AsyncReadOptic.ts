import { OpticType, total } from '@optix/core';
import { DeriveOpticType } from '@optix/core/src/types';
import { CombinatorsForOptic } from '../combinators';
import { _ReadOptic } from './ReadOptic';

export type AsyncReadOpticDeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<
    any,
    any
>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: AsyncReadOptic<
              T[P],
              DeriveOpticType<A, TOpticType>,
              S
          >;
      }
    : {};

export type _AsyncReadOptic<A, TOpticType extends OpticType, S> = _ReadOptic<A, TOpticType, S> & {
    getAsync(): Promise<A>;
    set(a: A | ((prev: A) => A)): void;
};
export type AsyncReadOptic<A, TOpticType extends OpticType = total, S = any> = _AsyncReadOptic<A, TOpticType, S> &
    AsyncReadOpticDeriveFromProps<A, TOpticType, S> &
    CombinatorsForOptic<A, TOpticType, S>;
