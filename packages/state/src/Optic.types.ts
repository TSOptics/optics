import { DeriveOpticType, _PureOptic } from '@optix/core/src/PureOptic.types';
import { FocusedValue, OpticType, total } from '@optix/core/src/types';

export interface GetSet<A, TOpticType extends OpticType> {
    set(a: A | ((prev: A) => A)): void;
    get<TOptions extends GetStateOptions | undefined>(options?: TOptions): ResolvedType<A, TOpticType, TOptions>;
}

export interface OpticInterface<A, TOpticType extends OpticType, S> {
    subscribe<TOptions extends SubscribeOptions | undefined>(
        listener: (a: ResolvedType<A, TOpticType, TOptions>) => void,
        options?: TOptions,
    ): () => void;
}

export interface OnTotal {
    reset(): void;
}

export type Denormalized<T> = T extends Optic<infer R, infer OpticType>
    ? Denormalized<FocusedValue<R, OpticType>>
    : T extends Date
    ? T
    : T extends Record<string, any>
    ? { [P in keyof T]: Denormalized<T[P]> } extends infer SubTree
        ? T extends SubTree
            ? T
            : SubTree
        : never
    : T;

export type ResolvedType<
    T,
    TOpticType extends OpticType,
    TOptions extends { denormalize?: boolean } | undefined,
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
    optic: OpticInterface<any, OpticType, any>;
    unsubscribe: () => void;
    readonly [leafSymbol]: 'leaf';
};

export type Dependencies = Array<Dependencies | undefined> | { [key: string]: Dependencies } | Dependency;

export type GetStateOptions = {
    denormalize?: boolean;
};

export type SubscribeOptions = {
    denormalize?: boolean;
};

type DeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: Optic<T[P], DeriveOpticType<A, TOpticType>, S>;
      }
    : {};

type _Optic<A, TOpticType extends OpticType = total, S = any> = _PureOptic<A, TOpticType, S> &
    OpticInterface<A, TOpticType, S> &
    (TOpticType extends total ? OnTotal : {});

export type Optic<A, TOpticType extends OpticType = total, S = any> = Omit<_Optic<A, TOpticType, S>, 'get' | 'set'> &
    GetSet<A, TOpticType> &
    DeriveFromProps<A, TOpticType, S>;

declare module '@optix/core/src/PureOptic.types' {
    export interface ResolveClass<TOptic, A, TOpticType extends OpticType, S> {
        (): [TOptic] extends [{ subscribe: any }] ? Optic<A, TOpticType, S> : PureOptic<A, TOpticType, S>;
    }
}
