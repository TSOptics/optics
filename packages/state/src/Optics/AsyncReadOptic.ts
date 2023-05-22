import { OpticType, total } from '@optics/core';
import { DeriveOpticType } from '@optics/core/src/types';
import { CombinatorsForOptic } from '../combinators';
import { _ReadOptic } from './ReadOptic';

export type AsyncReadOpticDeriveFromProps<A, TOpticType extends OpticType, T = NonNullable<A>> = T extends Record<
    any,
    any
>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: AsyncReadOptic<T[P], DeriveOpticType<A, TOpticType>>;
      }
    : {};

export type _AsyncReadOptic<A, TOpticType extends OpticType> = _ReadOptic<A, TOpticType> & {
    getAsync(): Promise<A>;
    set(a: A | ((prev: A) => A)): void;
};
export type AsyncReadOptic<A, TOpticType extends OpticType = total> = _AsyncReadOptic<A, TOpticType> &
    AsyncReadOpticDeriveFromProps<A, TOpticType> &
    CombinatorsForOptic<A, TOpticType>;
