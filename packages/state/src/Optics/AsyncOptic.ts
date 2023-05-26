import { OpticType, total, DeriveOpticType } from '@optics/core';
import { CombinatorsForOptic } from '../combinators';
import { _AsyncReadOptic } from './AsyncReadOptic';
import { _Optic } from './Optic';

export type AsyncOpticDeriveFromProps<A, TOpticType extends OpticType, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: AsyncOptic<T[P], DeriveOpticType<A, TOpticType>>;
      }
    : {};

export type _AsyncOptic<A, TOpticType extends OpticType> = _Optic<A, TOpticType> &
    _AsyncReadOptic<A, TOpticType> & {
        setAsync(a: A): Promise<void>;
    };
export type AsyncOptic<A, TOpticType extends OpticType = total> = _AsyncOptic<A, TOpticType> &
    AsyncOpticDeriveFromProps<A, TOpticType> &
    CombinatorsForOptic<A, TOpticType>;
