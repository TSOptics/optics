import { _PureReadOptic } from './PureReadOptic';
import { CombinatorsForOptic } from './combinators.types';
import { DeriveOpticType, OpticType, total } from './types';

export interface _PureOptic<A, TOpticType extends OpticType = total, S = any> extends _PureReadOptic<A, TOpticType, S> {
    set(a: A | ((prev: A) => A), s: S): S;
}

type DeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureOptic<T[P], DeriveOpticType<A, TOpticType>, S>;
      }
    : {};

export type PureOptic<A, TOpticType extends OpticType = total, S = any> = _PureOptic<A, TOpticType, S> &
    DeriveFromProps<A, TOpticType, S> &
    CombinatorsForOptic<A, TOpticType, S>;
