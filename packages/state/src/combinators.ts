import {
    OpticType,
    PureOptic,
    mapped,
    partial,
    total,
    ComposedOpticType,
    IsAny,
    IsNullable,
    ToPartial,
} from '@optics/core';
import { AsyncOptic } from './Optics/AsyncOptic';
import { AsyncReadOptic } from './Optics/AsyncReadOptic';
import { Optic } from './Optics/Optic';
import { ReadOptic } from './Optics/ReadOptic';

export interface BaseCombinators<A, TOpticType extends OpticType> {
    refine<B>(
        refiner: (a: NonNullable<A>) => B | false,
    ): B extends false ? never : Resolve<this, B, ToPartial<TOpticType>>;
    if(predicate: (a: NonNullable<A>) => boolean): Resolve<this, A, ToPartial<TOpticType>>;
    convert<B>(to: (a: NonNullable<A>) => B, from: (b: B) => NonNullable<A>): Resolve<this, B, TOpticType>;
    compose<B, TOpticTypeB extends OpticType>(
        other: PureOptic<B, TOpticTypeB, NonNullable<A>>,
    ): Resolve<this, B, ComposedOpticType<TOpticType, TOpticTypeB, A>>;
}

export interface TotalCombinators {
    reset(): void;
}

export interface ArrayCombinators<A, TOpticType extends OpticType, Elem = A extends (infer R)[] ? R : never> {
    map(): A extends (infer R)[] ? Resolve<this, R, mapped> : never;
    at(index: number): A extends (infer R)[] ? Resolve<this, R, ToPartial<TOpticType>> : never;
    indexBy<Key extends string | number, Elem = A extends (infer R)[] ? R : never>(
        f: (a: Elem) => Key,
    ): Resolve<this, Record<Key, Elem>, TOpticType>;
    findFirst(predicate: (a: Elem) => boolean): Resolve<this, Elem, ToPartial<TOpticType>>;
    min(
        ...arg: Elem extends number ? [f?: (a: Elem) => number] : [f: (a: Elem) => number]
    ): Resolve<this, Elem, ToPartial<TOpticType>>;
    max(
        ...arg: Elem extends number ? [f?: (a: Elem) => number] : [f: (a: Elem) => number]
    ): Resolve<this, Elem, ToPartial<TOpticType>>;
    reverse(): Resolve<this, A, TOpticType>;
    slice(start?: number, end?: number): Resolve<this, A, TOpticType>;
}

export interface RecordCombinators<A, TOpticType extends OpticType> {
    values(): A extends Record<string, infer R> ? Resolve<this, Array<R>, TOpticType> : never;
    entries(): A extends Record<string, infer R> ? Resolve<this, Array<readonly [string, R]>, TOpticType> : never;
}

export interface NullableCombinators<A, TOpticType extends OpticType> {
    toPartial(): Resolve<this, NonNullable<A>, ToPartial<TOpticType>>;
    default(fallback: () => NonNullable<A>): Resolve<this, NonNullable<A>, TOpticType>;
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

type CombinatorsForType<A, TOpticType extends OpticType> = (IsNullable<A> extends true
    ? NullableCombinators<A, TOpticType>
    : {}) &
    (NonNullable<A> extends any[]
        ? ArrayCombinators<NonNullable<A>, TOpticType>
        : Record<string, any> extends A
        ? NonNullable<A> extends Record<string, any>
            ? RecordCombinators<A, TOpticType>
            : {}
        : {});

type CombinatorsForOpticType<A, TOpticType extends OpticType> = TOpticType extends mapped
    ? MappedCombinators<A>
    : TOpticType extends total
    ? TotalCombinators
    : {};

export type CombinatorsForOptic<A, TOpticType extends OpticType> = BaseCombinators<A, TOpticType> &
    (IsAny<A> extends true ? {} : CombinatorsForType<A, TOpticType>) &
    CombinatorsForOpticType<A, TOpticType>;

export type Resolve<TOptic, A, TOpticType extends OpticType> = [TOptic] extends [{ setAsync(a: any): any }]
    ? AsyncOptic<A, TOpticType>
    : [TOptic] extends [{ set(a: any): any }]
    ? Optic<A, TOpticType>
    : [TOptic] extends [{ getAsync(): any }]
    ? AsyncReadOptic<A, TOpticType>
    : ReadOptic<A, TOpticType>;
