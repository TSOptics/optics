import { FocusedValue, PartialLens, TotalLens, partial, PureOptic, readOnly } from '@optics/core';
import { ComposeModifiers, GetStateOptions, Modifiers, SubscribeOptions } from '../types';
import { ContextualMethods } from '../ContextualMethods';

export type Denormalized<T> = [T] extends [Optic<infer TFocus, infer TModifiers extends Modifiers>]
    ? Denormalized<FocusedValue<TFocus, TModifiers>>
    : T extends Date
    ? T
    : [T] extends [Record<string, any>]
    ? { [P in keyof T]: Denormalized<T[P]> } extends infer SubTree
        ? T extends SubTree
            ? T
            : SubTree
        : never
    : T;

export type ResolvedType<
    T,
    TModifiers extends Modifiers,
    TOptions extends Pick<GetStateOptions, 'denormalize'>,
    TFocusedValue = FocusedValue<T, TModifiers>,
> = NonNullable<TOptions>['denormalize'] extends infer denormalize
    ? denormalize extends true
        ? Denormalized<TFocusedValue>
        : TFocusedValue
    : never;

export const leafSymbol: unique symbol = Symbol('dependency');

export type Dependency = {
    state?: any;
    optic: _Optic<any>;
    unsubscribe: () => void;
    readonly [leafSymbol]: 'leaf';
};

export type Dependencies = Array<Dependencies | undefined> | { [key: string]: Dependencies } | Dependency;

export type OpticDeriveFromProps<A, TModifiers extends Modifiers, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: Optic<T[P], ComposeModifiers<TModifiers, {}, A>>;
      }
    : {};

export interface _Optic<A, TModifiers extends Modifiers = {}> {
    get(): FocusedValue<A, TModifiers>;
    get<TOptions extends GetStateOptions>(options: TOptions): ResolvedType<A, TModifiers, TOptions>;

    subscribe(listener: (a: FocusedValue<A, TModifiers>) => void): () => void;
    subscribe<TOptions extends SubscribeOptions>(
        listener: (a: ResolvedType<A, TModifiers, TOptions>) => void,
        options: TOptions,
    ): () => void;

    derive<B>(lens: PartialLens<B, NonNullable<A>>): Optic<B, ComposeModifiers<TModifiers, partial, A>>;
    derive<B>(lens: TotalLens<B, NonNullable<A>>): Optic<B, ComposeModifiers<TModifiers, {}, A>>;
    derive<B>(lens: {
        get: (a: NonNullable<A>) => B;
        key?: string;
    }): Optic<B, ComposeModifiers<TModifiers, readOnly, A>>;
    derive<B, TModifiersB extends Modifiers>(
        other: PureOptic<B, TModifiersB, NonNullable<A>>,
    ): Optic<B, ComposeModifiers<TModifiers, TModifiersB, A>>;
}

export const tag: unique symbol = Symbol('tag');

export type Tag<A> = { [tag]: { focus: A; invariance: (a: A) => void } };

export type Optic<A, TModifiers extends Modifiers = {}> = _Optic<A, TModifiers> &
    OpticDeriveFromProps<A, TModifiers> &
    ContextualMethods<A, TModifiers> & {} & Tag<A>;
