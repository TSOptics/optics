import { ContextualMethods } from '../ContextualMethods';
import { PureOptic } from '../PureOptic/PureOptic';
import { FocusedValue, PartialLens, TotalLens, partial, Modifiers, ComposeModifiers } from '../types';

export interface _DataOptic<A, TModifiers extends Modifiers = {}, S = any> {
    get(): FocusedValue<A, TModifiers>;
    set(a: A | ((prev: A) => A)): DataOptic<S, {}, S>;

    derive<B>(lens: PartialLens<B, NonNullable<A>>): DataOptic<B, ComposeModifiers<TModifiers, partial, A>, S>;
    derive<B>(lens: TotalLens<B, NonNullable<A>>): DataOptic<B, ComposeModifiers<TModifiers, {}, A>, S>;
    derive<B, TModifiersB extends Modifiers>(
        other: PureOptic<B, TModifiersB, NonNullable<A>>,
    ): DataOptic<B, ComposeModifiers<TModifiers, TModifiersB, A>, S>;
}

export const tag: unique symbol = Symbol('DataOptic tag');

export type Tag<A, S> = {
    [tag]: [root: S, invariance: (a: A) => void];
};

type DeriveFromProps<A, TModifiers extends Modifiers, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: DataOptic<
              T[P],
              ComposeModifiers<TModifiers, {}, A>,
              S
          >;
      }
    : {};

export type DataOptic<A, TModifiers extends Modifiers = {}, S = any> = _DataOptic<A, TModifiers, S> &
    DeriveFromProps<A, TModifiers, S> &
    ContextualMethods<A, TModifiers, S> &
    Tag<A, S>;
