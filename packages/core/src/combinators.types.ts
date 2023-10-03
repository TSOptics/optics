import { PureOptic } from './PureOptic';
import { PureReadOptic } from './PureReadOptic';
import { mapped, OpticScope, partial } from './types';

export interface MappedCombinators<A, S> {
    reduceFindFirst(predicate: (a: A) => boolean): Resolve<this, A, partial, S>;
    reduceMax(...arg: A extends number ? [f?: (a: A) => number] : [f: (a: A) => number]): Resolve<this, A, partial, S>;
    reduceMin(...arg: A extends number ? [f?: (a: A) => number] : [f: (a: A) => number]): Resolve<this, A, partial, S>;
    reduceAt(index: number): Resolve<this, A, partial, S>;
    reduceFilter(predicate: (a: A) => boolean): Resolve<this, A, mapped, S>;
    reduceSlice(start?: number, end?: number): Resolve<this, A, mapped, S>;
    reduceSort(compareFn?: (a: A, b: A) => number): Resolve<this, A, mapped, S>;
}
export interface ArrayOptic<A, S> {
    map<Elem = A extends (infer R)[] ? R : never>(): Resolve<this, Elem, mapped, S>;
}

type CombinatorsForOpticScope<A, TScope extends OpticScope, S> = TScope extends mapped ? MappedCombinators<A, S> : {};

export type CombinatorsForOptic<A, TScope extends OpticScope, S> = CombinatorsForOpticScope<A, TScope, S> &
    (NonNullable<A> extends any[] ? ArrayOptic<NonNullable<A>, S> : {});

export type Resolve<TOptic, A, TScope extends OpticScope, S> = [TOptic] extends [{ set(a: any, s: any): any }]
    ? PureOptic<A, TScope, S>
    : PureReadOptic<A, TScope, S>;
