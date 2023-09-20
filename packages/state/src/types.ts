import { OpticScope } from '@optics/core';
import { ReadOptic, tag } from './Optics/ReadOptic';
import { AsyncOptic } from './Optics/AsyncOptic';
import { AsyncReadOptic } from './Optics/AsyncReadOptic';
import { Optic } from './Optics/Optic';

export type GetStateOptions = {
    denormalize?: boolean;
};

export type SubscribeOptions = {
    denormalize?: boolean;
};

export type GetOpticFocus<TOptic> = TOptic extends { [tag]: [scope: any, focus: infer T, invariance: any] } ? T : never;

export type GetOpticScope<TOptic> = TOptic extends { [tag]: [scope: infer T, focus: any, invariance: any] } ? T : never;

export type Resolve<TOptic, A, TScope extends OpticScope> = [TOptic] extends [{ setAsync(a: any): any }]
    ? AsyncOptic<A, TScope>
    : [TOptic] extends [{ getAsync(): any }]
    ? AsyncReadOptic<A, TScope>
    : [TOptic] extends [{ set(a: any): any }]
    ? Optic<A, TScope>
    : ReadOptic<A, TScope>;

export type ResolveReadOnly<TOptic, A, TScope extends OpticScope> = [TOptic] extends [
    { setAsync(a: any): any } | { getAsync(): any },
]
    ? AsyncReadOptic<A, TScope>
    : ReadOptic<A, TScope>;
