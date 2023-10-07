import { OpticScope, total, DeriveOpticScope } from '@optics/core';
import { Tag, _ReadOptic } from './ReadOptic';
import { ContextualMethods } from '../ContextualMethods';

export type AsyncReadOpticDeriveFromProps<A, TScope extends OpticScope, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: AsyncReadOptic<T[P], DeriveOpticScope<A, TScope>>;
      }
    : {};

export type _AsyncReadOptic<A, TScope extends OpticScope> = _ReadOptic<A, TScope> & {
    getAsync(): Promise<A>;
    set(a: A | ((prev: A) => A)): void;
};
export type AsyncReadOptic<A, TScope extends OpticScope = total> = _AsyncReadOptic<A, TScope> &
    AsyncReadOpticDeriveFromProps<A, TScope> &
    ContextualMethods<A, TScope> &
    Tag<A, TScope>;
