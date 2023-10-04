import { PureOptic } from './PureOptic';
import { PureReadOptic } from './PureReadOptic';
import { ReduceValue } from './set';
import { mapped, OpticScope, partial } from './types';

export interface MappedOptic<A, S> {
    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A>[]): Resolve<this, A, mapped, S>;
    reduce(reducer: (values: ReduceValue<A>[]) => ReduceValue<A> | undefined): Resolve<this, A, partial, S>;
}
export interface ArrayOptic<A, S> {
    map<Elem = A extends (infer R)[] ? R : never>(): Resolve<this, Elem, mapped, S>;
}

export type ContextualMethods<A, TScope extends OpticScope, S> = (TScope extends mapped ? MappedOptic<A, S> : {}) &
    (NonNullable<A> extends any[] ? ArrayOptic<NonNullable<A>, S> : {});

export type Resolve<TOptic, A, TScope extends OpticScope, S> = [TOptic] extends [{ set(a: any, s: any): any }]
    ? PureOptic<A, TScope, S>
    : PureReadOptic<A, TScope, S>;
