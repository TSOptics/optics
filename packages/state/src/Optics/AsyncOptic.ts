import { OpticType, total } from '@optix/core';
import { DeriveOpticType } from '@optix/core/src/types';
import { CombinatorsForOptic } from '../combinators';
import { _AsyncReadOptic } from './AsyncReadOptic';
import { _Optic } from './Optic';

export type AsyncOpticDeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<
    any,
    any
>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: AsyncOptic<T[P], DeriveOpticType<A, TOpticType>, S>;
      }
    : {};

export type _AsyncOptic<A, TOpticType extends OpticType, S> = _Optic<A, TOpticType, S> &
    _AsyncReadOptic<A, TOpticType, S> & {
        setAsync(a: A): Promise<void>;
    };
export type AsyncOptic<A, TOpticType extends OpticType = total, S = any> = _AsyncOptic<A, TOpticType, S> &
    AsyncOpticDeriveFromProps<A, TOpticType, S> &
    CombinatorsForOptic<A, TOpticType, S>;
