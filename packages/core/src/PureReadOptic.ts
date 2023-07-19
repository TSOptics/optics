import { CombinatorsForOptic } from './combinators.types';
import { DeriveOpticType, FocusedValue, OpticType, total } from './types';

export const tag: unique symbol = Symbol('tag');

export interface _PureReadOptic<A, TOpticType extends OpticType = total, S = any> {
    get(s: S): FocusedValue<A, TOpticType>;
    derive<B>(get: (a: NonNullable<A>) => B): PureReadOptic<B, DeriveOpticType<A, TOpticType>, S>;
    [tag]: [opticType: TOpticType, root: S, invariance: (a: A, s: S) => void];
}

type DeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureReadOptic<T[P], DeriveOpticType<A, TOpticType>, S>;
      }
    : {};

export type PureReadOptic<A, TOpticType extends OpticType = total, S = any> = _PureReadOptic<A, TOpticType, S> &
    DeriveFromProps<A, TOpticType, S> &
    CombinatorsForOptic<A, TOpticType, S>;
