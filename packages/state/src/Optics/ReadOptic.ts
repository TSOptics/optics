import {
    OpticScope,
    total,
    DeriveOpticScope,
    FocusedValue,
    PartialLens,
    TotalLens,
    partial,
    mapped,
    FoldLens,
    FoldNLens,
    ComposeScopes,
    PureOptic,
    PureReadOptic,
} from '@optics/core';
import { CombinatorsForOptic } from '../combinators';
import { GetStateOptions, Resolve, ResolveReadOnly, SubscribeOptions } from '../types';

export const tag: unique symbol = Symbol('tag');

export type Denormalized<T> = [T] extends [
    { [tag]: [scope: infer TScope extends OpticScope, focus: infer R, invariance: any] },
]
    ? Denormalized<FocusedValue<R, TScope>>
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
    TScope extends OpticScope,
    TOptions extends Pick<GetStateOptions, 'denormalize'> | undefined,
    TFocusedValue = FocusedValue<T, TScope>,
    TDenormalized = Denormalized<TFocusedValue>,
> = undefined extends TOptions
    ? TDenormalized
    : NonNullable<TOptions>['denormalize'] extends infer denormalize
    ? denormalize extends false
        ? TFocusedValue
        : TDenormalized
    : never;

export const leafSymbol: unique symbol = Symbol('dependency');

export type Dependency = {
    state?: any;
    optic: _ReadOptic<any, OpticScope>;
    unsubscribe: () => void;
    readonly [leafSymbol]: 'leaf';
};

export type Dependencies = Array<Dependencies | undefined> | { [key: string]: Dependencies } | Dependency;

export type ReadOpticDeriveFromProps<A, TScope extends OpticScope, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: ReadOptic<T[P], DeriveOpticScope<A, TScope>>;
      }
    : {};

export interface _ReadOptic<A, TScope extends OpticScope> {
    get<TOptions extends GetStateOptions | undefined>(options?: TOptions): ResolvedType<A, TScope, TOptions>;
    subscribe<TOptions extends SubscribeOptions | undefined>(
        listener: (a: ResolvedType<A, TScope, TOptions>) => void,
        options?: TOptions,
    ): () => void;

    derive<B>(lens: PartialLens<B, NonNullable<A>>): Resolve<this, B, TScope extends partial ? partial : TScope>;
    derive<B>(lens: TotalLens<B, NonNullable<A>>): Resolve<this, B, DeriveOpticScope<A, TScope>>;
    derive(lens: TScope extends mapped ? FoldLens<NonNullable<A>> : never): Resolve<this, A, partial>;
    derive(lens: TScope extends mapped ? FoldNLens<NonNullable<A>> : never): Resolve<this, A, mapped>;
    derive<B>(lens: {
        get: (a: NonNullable<A>) => B;
        key?: string;
    }): ResolveReadOnly<this, B, DeriveOpticScope<A, TScope>>;
    derive<B, TScopeB extends OpticScope>(
        other: PureOptic<B, TScopeB, NonNullable<A>>,
    ): Resolve<this, B, ComposeScopes<TScope, TScopeB, A>>;
    derive<B, TScopeB extends OpticScope>(
        other: PureReadOptic<B, TScopeB, NonNullable<A>>,
    ): ResolveReadOnly<this, B, ComposeScopes<TScope, TScopeB, A>>;

    [tag]: [scope: TScope, focus: A, invariance: (a: A) => void];
}

export type ReadOptic<A, TScope extends OpticScope = total> = _ReadOptic<A, TScope> &
    ReadOpticDeriveFromProps<A, TScope> &
    CombinatorsForOptic<A, TScope>;
