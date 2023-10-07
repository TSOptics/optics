import { OpticScope, mapped, partial, ReduceValue } from '@optics/core';
import { Resolve } from './types';

export interface MappedOptic<A> {
    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>[]): Resolve<this, A, mapped>;
    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A> | undefined): Resolve<this, A, partial>;
}
export interface ArrayOptic<A> {
    map<Elem = A extends (infer R)[] ? R : never>(): Resolve<this, Elem, mapped>;
}

export type ContextualMethods<A, TScope extends OpticScope> = (TScope extends mapped ? MappedOptic<A> : {}) &
    (NonNullable<A> extends any[] ? ArrayOptic<NonNullable<A>> : {});
