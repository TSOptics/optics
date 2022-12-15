import {
    ComposedOpticType,
    FocusedValue,
    IsNullable,
    mapped,
    OpticType,
    partial,
    Path,
    PathOpticType,
    PathType,
    total,
} from './types';
export type ToPartial<TOpticType extends OpticType> = TOpticType extends total ? partial : TOpticType;
export type FocusToPartial<TOpticType extends OpticType, T> = TOpticType extends total ? T : TOpticType;
interface PureOpticAccessors<A, TOpticType extends OpticType, S> {
    get(s: S): FocusedValue<A, TOpticType>;
    set(a: A | ((prev: A) => A), s: S): S;
}
export interface PureOpticInterface<A, TOpticType extends OpticType, S> {
    focus<TPath extends Path<A>>(
        path: TPath,
    ): Resolve<this, PathType<A, TPath>, FocusToPartial<TOpticType, PathOpticType<A, TPath>>, S>;
    compose<B, TOpticTypeB extends OpticType>(
        other: PureOptic<B, TOpticTypeB, NonNullable<A>>,
    ): Resolve<this, B, ComposedOpticType<TOpticType, TOpticTypeB, A>, S>;
    refine<B>(
        refiner: (a: NonNullable<A>) => B | false,
    ): B extends false ? never : Resolve<this, B, ToPartial<TOpticType>, S>;
    if(predicate: (a: NonNullable<A>) => boolean): Resolve<this, A, ToPartial<TOpticType>, S>;
    convert<B>(to: (a: NonNullable<A>) => B, from: (b: B) => NonNullable<A>): Resolve<this, B, TOpticType, S>;
}

export interface OnArray<A, S> {
    map(): A extends (infer R)[] ? Resolve<this, R, mapped, S> : never;
}

export interface OnRecord<A, S> {
    values(): A extends Record<string, infer R> ? Resolve<this, R, mapped, S> : never;
    entries(): A extends Record<string, infer R> ? Resolve<this, [key: string, value: R], mapped, S> : never;
}

export interface OnNullable<A, TOpticType extends OpticType, S> {
    toPartial(): Resolve<this, NonNullable<A>, ToPartial<TOpticType>, S>;
    default(fallback: () => NonNullable<A>): Resolve<this, NonNullable<A>, TOpticType, S>;
}

export interface Mapped<A, S> {
    findFirst(predicate: (a: A) => boolean): Resolve<this, A, partial, S>;
    maxBy(f: (a: A) => number): Resolve<this, A, partial, S>;
    minBy(f: (a: A) => number): Resolve<this, A, partial, S>;
    atIndex(index: number): Resolve<this, A, partial, S>;
    filter(predicate: (a: A) => boolean): Resolve<this, A, mapped, S>;
    slice(start?: number, end?: number): Resolve<this, A, mapped, S>;
    sort(compareFn?: (a: A, b: A) => number): Resolve<this, A, mapped, S>;
}

type ResolveFromType<A, TOpticType extends OpticType, S> = (IsNullable<A> extends true
    ? OnNullable<A, TOpticType, S>
    : {}) &
    (NonNullable<A> extends any[]
        ? OnArray<A, S>
        : Record<string, any> extends A
        ? NonNullable<A> extends Record<string, any>
            ? OnRecord<A, S>
            : {}
        : {});

type ResolveFromOpticType<A, TOpticType extends OpticType, S> = TOpticType extends mapped ? Mapped<A, S> : {};

type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

export type PureOptic<A, TOpticType extends OpticType = total, S = any> = PureOpticInterface<A, TOpticType, S> &
    PureOpticAccessors<A, TOpticType, S> &
    (IsAny<A> extends true ? {} : ResolveFromType<A, TOpticType, S>) &
    ResolveFromOpticType<A, TOpticType, S>;

export interface ResolveClass<TOptic, A, TOpticType extends OpticType, S> {
    (): PureOptic<A, TOpticType, S>;
}
export type Resolve<TOptic, A, TOpticType extends OpticType, S> = ReturnType<ResolveClass<TOptic, A, TOpticType, S>>;

declare const o: PureOptic<{ a: string } | undefined>;
declare const o2: PureOptic<string, total, string>;
