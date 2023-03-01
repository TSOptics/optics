import { ComposedOpticType, FocusedValue, IsNullable, mapped, OpticType, partial, total } from './types';
export type ToPartial<TOpticType extends OpticType> = TOpticType extends total ? partial : TOpticType;
export type FocusToPartial<TOpticType extends OpticType, T> = TOpticType extends total ? T : TOpticType;
interface PureOpticAccessors<A, TOpticType extends OpticType, S> {
    get(s: S): FocusedValue<A, TOpticType>;
    set(a: A | ((prev: A) => A), s: S): S;
}
export interface PureOpticInterface<A, TOpticType extends OpticType, S> {
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

export interface OnRecord<A, TOpticType extends OpticType, S> {
    values(): A extends Record<string, infer R> ? Resolve<this, Array<R>, TOpticType, S> : never;
    entries(): A extends Record<string, infer R> ? Resolve<this, Array<readonly [string, R]>, TOpticType, S> : never;
}

export interface OnNullable<A, TOpticType extends OpticType, S> {
    toPartial(): Resolve<this, NonNullable<A>, ToPartial<TOpticType>, S>;
    default(fallback: () => NonNullable<A>): Resolve<this, NonNullable<A>, TOpticType, S>;
}

export interface Mapped<A, S> {
    findFirst(predicate: (a: A) => boolean): Resolve<this, A, partial, S>;
    max(...arg: A extends number ? [f?: (a: A) => number] : [f: (a: A) => number]): Resolve<this, A, partial, S>;
    min(...arg: A extends number ? [f?: (a: A) => number] : [f: (a: A) => number]): Resolve<this, A, partial, S>;
    at(index: number): Resolve<this, A, partial, S>;
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
            ? OnRecord<A, TOpticType, S>
            : {}
        : {});

type ResolveFromOpticType<A, TOpticType extends OpticType, S> = TOpticType extends mapped ? Mapped<A, S> : {};

type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

export type DeriveOpticType<T, TOpticType extends OpticType> = IsNullable<T> extends true
    ? TOpticType extends partial
        ? partial
        : TOpticType
    : TOpticType;

type DeriveFromProps<A, TOpticType extends OpticType, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureOptic<T[P], DeriveOpticType<A, TOpticType>, S>;
      }
    : {};

export type _PureOptic<A, TOpticType extends OpticType = total, S = any> = PureOpticInterface<A, TOpticType, S> &
    PureOpticAccessors<A, TOpticType, S> &
    (IsAny<A> extends true ? {} : ResolveFromType<A, TOpticType, S>) &
    ResolveFromOpticType<A, TOpticType, S>;

export type PureOptic<A, TOpticType extends OpticType = total, S = any> = _PureOptic<A, TOpticType, S> &
    DeriveFromProps<A, TOpticType, S>;

export interface ResolveClass<TOptic, A, TOpticType extends OpticType, S> {
    (): PureOptic<A, TOpticType, S>;
}
export type Resolve<TOptic, A, TOpticType extends OpticType, S> = ReturnType<ResolveClass<TOptic, A, TOpticType, S>>;
