import { PureOptic } from './PureOptic';
import { CombinatorsForOptic, Resolve } from './combinators.types';
import {
    ComposeScopes,
    DeriveOpticScope,
    FocusedValue,
    FoldLens,
    FoldNLens,
    OpticScope,
    PartialLens,
    TotalLens,
    mapped,
    partial,
    total,
} from './types';

export const tag: unique symbol = Symbol('tag');

export interface _PureReadOptic<A, TScope extends OpticScope = total, S = any> {
    get(s: S): FocusedValue<A, TScope>;

    derive<B>(lens: PartialLens<B, NonNullable<A>>): Resolve<this, B, TScope extends partial ? partial : TScope, S>;
    derive<B>(lens: TotalLens<B, NonNullable<A>>): Resolve<this, B, DeriveOpticScope<A, TScope>, S>;
    derive(lens: TScope extends mapped ? FoldLens<NonNullable<A>> : never): Resolve<this, A, partial, S>;
    derive(lens: TScope extends mapped ? FoldNLens<NonNullable<A>> : never): Resolve<this, A, mapped, S>;
    derive<B>(lens: { get: (a: NonNullable<A>) => B; key?: string }): PureReadOptic<B, DeriveOpticScope<A, TScope>, S>;
    derive<B, TScopeB extends OpticScope>(
        other: PureOptic<B, TScopeB, NonNullable<A>>,
    ): Resolve<this, B, ComposeScopes<TScope, TScopeB, A>, S>;
    derive<B, TScopeB extends OpticScope>(
        other: PureReadOptic<B, TScopeB, NonNullable<A>>,
    ): PureReadOptic<B, ComposeScopes<TScope, TScopeB, A>, S>;

    pipe<B>(fn1: (optic: this) => B): B;
    pipe<B, C>(fn1: (optic: this) => B, fn2: (b: B) => C): C;
    pipe<B, C, D>(fn1: (optic: this) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
    pipe<B, C, D, E>(fn1: (optic: this) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): E;
    pipe<B, C, D, E, F>(
        fn1: (optic: this) => B,
        fn2: (b: B) => C,
        fn3: (c: C) => D,
        fn4: (d: D) => E,
        fn5: (e: E) => F,
    ): F;
    pipe<B, C, D, E, F, G>(
        fn1: (optic: this) => B,
        fn2: (b: B) => C,
        fn3: (c: C) => D,
        fn4: (d: D) => E,
        fn5: (e: E) => F,
        fn6: (f: F) => G,
    ): G;
    pipe<B, C, D, E, F, G, H>(
        fn1: (optic: this) => B,
        fn2: (b: B) => C,
        fn3: (c: C) => D,
        fn4: (d: D) => E,
        fn5: (e: E) => F,
        fn6: (f: F) => G,
        fn7: (f: G) => H,
    ): H;
    pipe<B, C, D, E, F, G, H, I>(
        fn1: (optic: this) => B,
        fn2: (b: B) => C,
        fn3: (c: C) => D,
        fn4: (d: D) => E,
        fn5: (e: E) => F,
        fn6: (f: F) => G,
        fn7: (f: G) => H,
        fn8: (f: H) => I,
    ): I;
    pipe<B, C, D, E, F, G, H, I, J>(
        fn1: (optic: this) => B,
        fn2: (b: B) => C,
        fn3: (c: C) => D,
        fn4: (d: D) => E,
        fn5: (e: E) => F,
        fn6: (f: F) => G,
        fn7: (f: G) => H,
        fn8: (f: H) => I,
        fn9: (f: I) => J,
    ): J;
    pipe<B, C, D, E, F, G, H, I, J, K>(
        fn1: (optic: this) => B,
        fn2: (b: B) => C,
        fn3: (c: C) => D,
        fn4: (d: D) => E,
        fn5: (e: E) => F,
        fn6: (f: F) => G,
        fn7: (f: G) => H,
        fn8: (f: H) => I,
        fn9: (f: I) => J,
        fn10: (f: J) => K,
    ): K;

    [tag]: [scope: TScope, root: S, invariance: (a: A, s: S) => void];
}

type DeriveFromProps<A, TScope extends OpticScope, S, T = NonNullable<A>> = T extends Record<any, any>
    ? {
          [P in keyof T as T[P] extends Function ? never : P]-?: PureReadOptic<T[P], DeriveOpticScope<A, TScope>, S>;
      }
    : {};

export type PureReadOptic<A, TScope extends OpticScope = total, S = any> = _PureReadOptic<A, TScope, S> &
    DeriveFromProps<A, TScope, S> &
    CombinatorsForOptic<A, TScope, S>;
