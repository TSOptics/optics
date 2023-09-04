import { PureOptic } from './PureOptic';
import { PureReadOptic } from './PureReadOptic';
import { ComposeScopes, IsAny, IsNullable, mapped, OpticScope, partial, ToPartial } from './types';

export interface BaseCombinators<A, TScope extends OpticScope, S> {
    refine<B>(
        refiner: (a: NonNullable<A>) => B | false,
    ): B extends false ? never : Resolve<this, B, ToPartial<TScope>, S>;
    if(predicate: (a: NonNullable<A>) => boolean): Resolve<this, A, ToPartial<TScope>, S>;
    compose<B, TScopeB extends OpticScope>(
        other: PureOptic<B, TScopeB, NonNullable<A>>,
    ): Resolve<this, B, ComposeScopes<TScope, TScopeB, A>, S>;
    compose<B, TScopeB extends OpticScope>(
        other: PureReadOptic<B, TScopeB, NonNullable<A>>,
    ): PureReadOptic<B, ComposeScopes<TScope, TScopeB, A>, S>;
}

export interface ArrayCombinators<A, TScope extends OpticScope, S, Elem = A extends (infer R)[] ? R : never> {
    map(): Resolve<this, Elem, mapped, S>;
    at(index: number): Resolve<this, Elem, ToPartial<TScope>, S>;
    indexBy<Key extends string | number>(f: (a: Elem) => Key): Resolve<this, Record<Key, Elem>, TScope, S>;
    findFirst(predicate: (a: Elem) => boolean): Resolve<this, Elem, ToPartial<TScope>, S>;
    min(
        ...arg: Elem extends number ? [f?: (a: Elem) => number] : [f: (a: Elem) => number]
    ): Resolve<this, Elem, ToPartial<TScope>, S>;
    max(
        ...arg: Elem extends number ? [f?: (a: Elem) => number] : [f: (a: Elem) => number]
    ): Resolve<this, Elem, ToPartial<TScope>, S>;
    reverse(): Resolve<this, A, TScope, S>;
    slice(start?: number, end?: number): Resolve<this, A, TScope, S>;
}

export interface RecordCombinators<A, TScope extends OpticScope, S> {
    values(): A extends Record<string, infer R> ? Resolve<this, Array<R>, TScope, S> : never;
    entries(): A extends Record<string, infer R> ? Resolve<this, Array<readonly [string, R]>, TScope, S> : never;
}

export interface NullableCombinators<A, TScope extends OpticScope, S> {
    toPartial(): Resolve<this, NonNullable<A>, ToPartial<TScope>, S>;
    default(fallback: () => NonNullable<A>): Resolve<this, NonNullable<A>, TScope, S>;
}

export interface MappedCombinators<A, S> {
    reduceFindFirst(predicate: (a: A) => boolean): Resolve<this, A, partial, S>;
    reduceMax(...arg: A extends number ? [f?: (a: A) => number] : [f: (a: A) => number]): Resolve<this, A, partial, S>;
    reduceMin(...arg: A extends number ? [f?: (a: A) => number] : [f: (a: A) => number]): Resolve<this, A, partial, S>;
    reduceAt(index: number): Resolve<this, A, partial, S>;
    reduceFilter(predicate: (a: A) => boolean): Resolve<this, A, mapped, S>;
    reduceSlice(start?: number, end?: number): Resolve<this, A, mapped, S>;
    reduceSort(compareFn?: (a: A, b: A) => number): Resolve<this, A, mapped, S>;
}

type CombinatorsForType<A, TScope extends OpticScope, S> = (IsNullable<A> extends true
    ? NullableCombinators<A, TScope, S>
    : {}) &
    (NonNullable<A> extends any[]
        ? ArrayCombinators<NonNullable<A>, TScope, S>
        : Record<string, any> extends A
        ? NonNullable<A> extends Record<string, any>
            ? RecordCombinators<A, TScope, S>
            : {}
        : {});

type CombinatorsForOpticScope<A, TScope extends OpticScope, S> = TScope extends mapped ? MappedCombinators<A, S> : {};

export type CombinatorsForOptic<A, TScope extends OpticScope, S> = BaseCombinators<A, TScope, S> &
    (IsAny<A> extends true ? {} : CombinatorsForType<A, TScope, S>) &
    CombinatorsForOpticScope<A, TScope, S>;

export type Resolve<TOptic, A, TScope extends OpticScope, S> = [TOptic] extends [{ set(a: any, s: any): any }]
    ? PureOptic<A, TScope, S>
    : PureReadOptic<A, TScope, S>;
