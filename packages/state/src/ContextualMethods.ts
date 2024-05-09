import { mapped, partial, readOnly, ReduceValue } from '@optics/core';
import { Modifiers } from './types';
import { Optic } from './Optics/Optic';

export interface MappedOptic<A, TModifiers extends Modifiers> {
    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>[]): Optic<A, TModifiers & mapped>;
    reduce(
        reducer: (values: ReduceValue<A>[]) => ReduceValue<A> | undefined,
    ): Optic<A, Omit<TModifiers, 'map'> & partial>;
}
export interface ArrayOptic<A, TModifiers extends Modifiers> {
    map<Elem = A extends (infer R)[] ? R : never>(): Optic<Elem, TModifiers & mapped>;
}

export interface WriteOptic<A> {
    set(a: A | ((prev: A) => A)): void;
}

export type ContextualMethods<A, TModifiers extends Modifiers> = (Pick<TModifiers, 'map'> extends mapped
    ? MappedOptic<A, TModifiers>
    : {}) &
    (Pick<TModifiers, 'readOnly'> extends readOnly ? {} : WriteOptic<A>) &
    (NonNullable<A> extends any[] ? ArrayOptic<NonNullable<A>, TModifiers> : {});
