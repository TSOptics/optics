import { DataOptic, tag as dataOpticTag } from './DataOptic/DataOptic';
import { PureOptic } from './PureOptic/PureOptic';
import { ReduceValue } from './set';
import { Modifiers, mapped, partial, readOnly } from './types';

export interface MappedOptic<A, TModifiers extends Modifiers, S> {
    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>[]): Resolve<this, A, TModifiers & mapped, S>;
    reduce(
        reducer: (values: ReduceValue<A>[]) => ReduceValue<A> | undefined,
    ): Resolve<this, A, Omit<TModifiers, 'map'> & partial, S>;
}
export interface ArrayOptic<A, TModifiers extends Modifiers, S> {
    map<Elem = A extends (infer R)[] ? R : never>(): Resolve<this, Elem, TModifiers & mapped, S>;
}

export interface WriteOptic<A, S> {
    set(a: A | ((prev: A) => A), s: S): S;
}

export type ContextualMethods<A, TModifiers extends Modifiers, S> = (Pick<TModifiers, 'map'> extends mapped
    ? MappedOptic<A, TModifiers, S>
    : {}) &
    (Pick<TModifiers, 'readOnly'> extends readOnly ? {} : WriteOptic<A, S>) &
    (NonNullable<A> extends any[] ? ArrayOptic<NonNullable<A>, TModifiers, S> : {});

export type Resolve<TOptic, A, TModifiers extends Modifiers, S> = [TOptic] extends [{ [dataOpticTag]: any }]
    ? DataOptic<A, TModifiers, S>
    : PureOptic<A, TModifiers, S>;
