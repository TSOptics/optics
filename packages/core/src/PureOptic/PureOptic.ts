import { ContextualMethods } from '../ContextualMethods';
import { ComposeModifiers, FocusedValue, Modifiers, PartialLens, TotalLens, partial, readOnly } from '../types';

export const tag: unique symbol = Symbol('tag');

export type Tag<A, S> = {
    [tag]: [root: S, invariance: (a: A, s: S) => void];
};

export interface _PureOptic<A, TModifiers extends Modifiers = {}, S = any> {
    get(s: S): FocusedValue<A, TModifiers>;

    derive<B>(lens: PartialLens<B, NonNullable<A>>): PureOptic<B, ComposeModifiers<TModifiers, partial, A>, S>;
    derive<B>(lens: TotalLens<B, NonNullable<A>>): PureOptic<B, ComposeModifiers<TModifiers, {}, A>, S>;
    derive<B>(lens: {
        get: (a: NonNullable<A>) => B;
        key?: string;
    }): PureOptic<B, ComposeModifiers<TModifiers, readOnly, A>, S>;
    derive<B, TModifiersB extends Modifiers>(
        other: PureOptic<B, TModifiersB, NonNullable<A>>,
    ): PureOptic<B, ComposeModifiers<TModifiers, TModifiersB, A>, S>;
}

type DeriveFromProps<A, TModifiers extends Modifiers, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureOptic<
              T[P],
              ComposeModifiers<TModifiers, {}, A>,
              S
          >;
      }
    : {};

export type PureOptic<A, TModifiers extends Modifiers = {}, S = any> = _PureOptic<A, TModifiers, S> &
    DeriveFromProps<A, TModifiers, S> &
    ContextualMethods<A, TModifiers, S> &
    Tag<A, S>;
