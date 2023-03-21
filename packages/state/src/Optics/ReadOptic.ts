import { OpticType } from '@optix/core';
import { DeriveOpticType, FocusedValue, total } from '@optix/core/src/types';
import { CombinatorsForOptic } from '../combinators';
import { GetStateOptions, SubscribeOptions } from '../types';

export const tag: unique symbol = Symbol('tag');

export type Denormalized<T> = [T] extends [
    { [tag]: [opticType: infer TOpticType extends OpticType, focus: infer R, invariance: any] },
]
    ? Denormalized<FocusedValue<R, TOpticType>>
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
    TOpticType extends OpticType,
    TOptions extends Pick<GetStateOptions, 'denormalize'> | undefined,
    TFocusedValue = FocusedValue<T, TOpticType>,
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
    optic: _ReadOptic<any, OpticType, any>;
    unsubscribe: () => void;
    readonly [leafSymbol]: 'leaf';
};

export type Dependencies = Array<Dependencies | undefined> | { [key: string]: Dependencies } | Dependency;

export type ReadOpticDeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<
    any,
    any
>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: ReadOptic<T[P], DeriveOpticType<A, TOpticType>, S>;
      }
    : {};

export type _ReadOptic<A, TOpticType extends OpticType, S> = {
    get<TOptions extends GetStateOptions | undefined>(options?: TOptions): ResolvedType<A, TOpticType, TOptions>;
    subscribe<TOptions extends SubscribeOptions | undefined>(
        listener: (a: ResolvedType<A, TOpticType, TOptions>) => void,
        options?: TOptions,
    ): () => void;
    [tag]: [opticType: TOpticType, focus: A, invariance: (a: A) => void];
};

export type ReadOptic<A, TOpticType extends OpticType = total, S = any> = _ReadOptic<A, TOpticType, S> &
    ReadOpticDeriveFromProps<A, TOpticType, S> &
    CombinatorsForOptic<A, TOpticType, S>;
