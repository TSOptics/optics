import { OpticScope, total, DeriveOpticScope } from '@optics/core';
import { _AsyncReadOptic } from './AsyncReadOptic';
import { _Optic } from './Optic';
import { ContextualMethods } from '../ContextualMethods';
import { Tag } from './ReadOptic';

export type AsyncOpticDeriveFromProps<A, TScope extends OpticScope, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: AsyncOptic<T[P], DeriveOpticScope<A, TScope>>;
      }
    : {};

export type _AsyncOptic<A, TScope extends OpticScope> = _Optic<A, TScope> &
    _AsyncReadOptic<A, TScope> & {
        setAsync(a: A): Promise<void>;
    };
export type AsyncOptic<A, TScope extends OpticScope = total> = _AsyncOptic<A, TScope> &
    AsyncOpticDeriveFromProps<A, TScope> &
    ContextualMethods<A, TScope> &
    Tag<A, TScope>;
