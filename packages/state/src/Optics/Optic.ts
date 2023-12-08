import { OpticScope, total, DeriveOpticScope } from '@optics/core';
import { Tag, _ReadOptic, tag } from './ReadOptic';
import { ContextualMethods } from '../ContextualMethods';

type OpticDeriveFromProps<A, TScope extends OpticScope, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: Optic<T[P], DeriveOpticScope<A, TScope>>;
      }
    : {};

export interface _Optic<A, TScope extends OpticScope> extends _ReadOptic<A, TScope> {
    set(a: A | ((prev: A) => A)): void;
}

export type TagWriteable<A, Tscope extends OpticScope> = { [tag]: Tag<A, Tscope>[typeof tag] & { writeable: true } };

export type Optic<A, TScope extends OpticScope = total> = _Optic<A, TScope> &
    OpticDeriveFromProps<A, TScope> &
    ContextualMethods<A, TScope> &
    TagWriteable<A, TScope>;
