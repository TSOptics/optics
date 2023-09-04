import { tag } from './Optics/ReadOptic';

export type GetStateOptions = {
    denormalize?: boolean;
};

export type SubscribeOptions = {
    denormalize?: boolean;
};

export type GetOpticFocus<TOptic> = TOptic extends { [tag]: [scope: any, focus: infer T, invariance: any] } ? T : never;

export type GetOpticScope<TOptic> = TOptic extends { [tag]: [scope: infer T, focus: any, invariance: any] } ? T : never;
