import { IsNullable, mapped, partial, readOnly } from '@optics/core';

export type GetStateOptions = {
    denormalize?: boolean;
};

export type SubscribeOptions = {
    denormalize?: boolean;
};

export type async = {
    async: 'async';
};

export type Modifiers = Partial<readOnly & partial & mapped & async>;

export type ComposeModifiers<TModifiersA extends Modifiers, TModifiersB extends Modifiers, A> = TModifiersA &
    TModifiersB &
    (IsNullable<A> extends true ? partial : {}) extends infer Final extends Modifiers
    ? Final
    : never;
