import { CombinatorsForOptic } from './combinators.types';
import { DeriveOpticType, FocusedValue, OpticType, total } from './types';

const tag: unique symbol = Symbol('tag');

export interface _PureOptic<A, TOpticType extends OpticType = total, S = any> {
    get(s: S): FocusedValue<A, TOpticType>;
    set(a: A | ((prev: A) => A), s: S): S;
}

type DeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureOptic<T[P], DeriveOpticType<A, TOpticType>, S>;
      }
    : {};

export type PureOptic<A, TOpticType extends OpticType = total, S = any> = {
    [tag]: [opticType: TOpticType, root: S, invariance: (a: A, s: S) => void];
} & _PureOptic<A, TOpticType, S> &
    DeriveFromProps<A, TOpticType, S> &
    CombinatorsForOptic<A, TOpticType, S>;
