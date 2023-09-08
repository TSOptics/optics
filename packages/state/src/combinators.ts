import {
    OpticScope,
    PureOptic,
    mapped,
    partial,
    total,
    ComposeScopes,
    IsAny,
    IsNullable,
    ToPartial,
    PureReadOptic,
    DeriveOpticScope,
    Lens,
} from '@optics/core';
import { AsyncOptic } from './Optics/AsyncOptic';
import { AsyncReadOptic } from './Optics/AsyncReadOptic';
import { Optic } from './Optics/Optic';
import { ReadOptic } from './Optics/ReadOptic';

export interface BaseCombinators<A, TScope extends OpticScope> {
    refine<B>(refiner: (a: NonNullable<A>) => B | false): B extends false ? never : Resolve<this, B, ToPartial<TScope>>;
    if(predicate: (a: NonNullable<A>) => boolean): Resolve<this, A, ToPartial<TScope>>;
    compose<B, TScopeB extends OpticScope>(
        other: PureOptic<B, TScopeB, NonNullable<A>>,
    ): Resolve<this, B, ComposeScopes<TScope, TScopeB, A>>;
    compose<B, TScopeB extends OpticScope>(
        other: PureReadOptic<B, TScopeB, NonNullable<A>>,
    ): ResolveReadOnly<this, B, ComposeScopes<TScope, TScopeB, A>>;
    derive<B>(lens: Lens<B, NonNullable<A>>): Resolve<this, B, DeriveOpticScope<A, TScope>>;
    derive<B>(lens: {
        get: (a: NonNullable<A>) => B;
        key?: string;
    }): ResolveReadOnly<this, B, DeriveOpticScope<A, TScope>>;
}

export interface TotalCombinators {
    reset(): void;
}

export interface ArrayCombinators<A, TScope extends OpticScope, Elem = A extends (infer R)[] ? R : never> {
    map(): A extends (infer R)[] ? Resolve<this, R, mapped> : never;
    at(index: number): A extends (infer R)[] ? Resolve<this, R, ToPartial<TScope>> : never;
    indexBy<Key extends string | number, Elem = A extends (infer R)[] ? R : never>(
        f: (a: Elem) => Key,
    ): Resolve<this, Record<Key, Elem>, TScope>;
    findFirst(predicate: (a: Elem) => boolean): Resolve<this, Elem, ToPartial<TScope>>;
    min(
        ...arg: Elem extends number ? [f?: (a: Elem) => number] : [f: (a: Elem) => number]
    ): Resolve<this, Elem, ToPartial<TScope>>;
    max(
        ...arg: Elem extends number ? [f?: (a: Elem) => number] : [f: (a: Elem) => number]
    ): Resolve<this, Elem, ToPartial<TScope>>;
    reverse(): Resolve<this, A, TScope>;
    slice(start?: number, end?: number): Resolve<this, A, TScope>;
}

export interface RecordCombinators<A, TScope extends OpticScope> {
    values(): A extends Record<string, infer R> ? Resolve<this, Array<R>, TScope> : never;
    entries(): A extends Record<string, infer R> ? Resolve<this, Array<readonly [string, R]>, TScope> : never;
}

export interface NullableCombinators<A, TScope extends OpticScope> {
    toPartial(): Resolve<this, NonNullable<A>, ToPartial<TScope>>;
    default(fallback: () => NonNullable<A>): Resolve<this, NonNullable<A>, TScope>;
}

export interface MappedCombinators<A> {
    reduceFindFirst(predicate: (a: A) => boolean): Resolve<this, A, partial>;
    reduceMax(...arg: A extends number ? [f?: (a: A) => number] : [f: (a: A) => number]): Resolve<this, A, partial>;
    reduceMin(...arg: A extends number ? [f?: (a: A) => number] : [f: (a: A) => number]): Resolve<this, A, partial>;
    reduceAt(index: number): Resolve<this, A, partial>;
    reduceFilter(predicate: (a: A) => boolean): Resolve<this, A, mapped>;
    reduceSlice(start?: number, end?: number): Resolve<this, A, mapped>;
    reduceSort(compareFn?: (a: A, b: A) => number): Resolve<this, A, mapped>;
}

type CombinatorsForType<A, TScope extends OpticScope> = (IsNullable<A> extends true
    ? NullableCombinators<A, TScope>
    : {}) &
    (NonNullable<A> extends any[]
        ? ArrayCombinators<NonNullable<A>, TScope>
        : Record<string, any> extends A
        ? NonNullable<A> extends Record<string, any>
            ? RecordCombinators<A, TScope>
            : {}
        : {});

type CombinatorsForOpticScope<A, TScope extends OpticScope> = TScope extends mapped
    ? MappedCombinators<A>
    : TScope extends total
    ? TotalCombinators
    : {};

export type CombinatorsForOptic<A, TScope extends OpticScope> = BaseCombinators<A, TScope> &
    (IsAny<A> extends true ? {} : CombinatorsForType<A, TScope>) &
    CombinatorsForOpticScope<A, TScope>;

export type Resolve<TOptic, A, TScope extends OpticScope> = [TOptic] extends [{ setAsync(a: any): any }]
    ? AsyncOptic<A, TScope>
    : [TOptic] extends [{ getAsync(): any }]
    ? AsyncReadOptic<A, TScope>
    : [TOptic] extends [{ set(a: any): any }]
    ? Optic<A, TScope>
    : ReadOptic<A, TScope>;

export type ResolveReadOnly<TOptic, A, TScope extends OpticScope> = [TOptic] extends [
    { setAsync(a: any): any } | { getAsync(): any },
]
    ? AsyncReadOptic<A, TScope>
    : ReadOptic<A, TScope>;
