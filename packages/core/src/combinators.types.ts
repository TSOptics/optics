import { PureOptic } from './PureOptic.types';
import { ComposedOpticType, IsAny, IsNullable, mapped, OpticType, partial, ToPartial } from './types';

export interface BaseCombinators<A, TOpticType extends OpticType, S> {
    refine<B>(
        refiner: (a: NonNullable<A>) => B | false,
    ): B extends false ? never : Resolve<this, B, ToPartial<TOpticType>, S>;
    if(predicate: (a: NonNullable<A>) => boolean): Resolve<this, A, ToPartial<TOpticType>, S>;
    convert<B>(to: (a: NonNullable<A>) => B, from: (b: B) => NonNullable<A>): Resolve<this, B, TOpticType, S>;
    compose<B, TOpticTypeB extends OpticType>(
        other: PureOptic<B, TOpticTypeB, NonNullable<A>>,
    ): Resolve<this, B, ComposedOpticType<TOpticType, TOpticTypeB, A>, S>;
}

export interface ArrayCombinators<A, TOpticType extends OpticType, S> {
    map(): A extends (infer R)[] ? Resolve<this, R, mapped, S> : never;
    at(index: number): A extends (infer R)[] ? Resolve<this, R, ToPartial<TOpticType>, S> : never;
    indexBy<Key extends string | number, Elem = A extends (infer R)[] ? R : never>(
        f: (a: Elem) => Key,
    ): Resolve<this, Record<Key, Elem>, TOpticType, S>;
}

export interface RecordCombinators<A, TOpticType extends OpticType, S> {
    values(): A extends Record<string, infer R> ? Resolve<this, Array<R>, TOpticType, S> : never;
    entries(): A extends Record<string, infer R> ? Resolve<this, Array<readonly [string, R]>, TOpticType, S> : never;
}

export interface NullableCombinators<A, TOpticType extends OpticType, S> {
    toPartial(): Resolve<this, NonNullable<A>, ToPartial<TOpticType>, S>;
    default(fallback: () => NonNullable<A>): Resolve<this, NonNullable<A>, TOpticType, S>;
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

type CombinatorsForType<A, TOpticType extends OpticType, S> = (IsNullable<A> extends true
    ? NullableCombinators<A, TOpticType, S>
    : {}) &
    (NonNullable<A> extends any[]
        ? ArrayCombinators<NonNullable<A>, TOpticType, S>
        : Record<string, any> extends A
        ? NonNullable<A> extends Record<string, any>
            ? RecordCombinators<A, TOpticType, S>
            : {}
        : {});

type CombinatorsForOpticType<A, TOpticType extends OpticType, S> = TOpticType extends mapped
    ? MappedCombinators<A, S>
    : {};

export type CombinatorsForOptic<A, TOpticType extends OpticType, S> = BaseCombinators<A, TOpticType, S> &
    (IsAny<A> extends true ? {} : CombinatorsForType<A, TOpticType, S>) &
    CombinatorsForOpticType<A, TOpticType, S>;

export interface _Resolve<TOptic, A, TOpticType extends OpticType, S> {
    (): PureOptic<A, TOpticType, S>;
}
export type Resolve<TOptic, A, TOpticType extends OpticType, S> = ReturnType<_Resolve<TOptic, A, TOpticType, S>>;
