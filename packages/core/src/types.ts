export interface partial {
    partial: 'partial';
}

export interface mapped {
    map: 'map';
}

export type readOnly = {
    readOnly: true;
};

export type Modifiers = Partial<readOnly & partial & mapped>;

export interface Lens<A = any, S = any> {
    get: (s: S) => A;
    set: (a: A, s: S) => S;
    key?: string;
    type?: 'fold' | 'map' | 'partial' | 'unstable';
}

export type TotalLens<A = any, S = any> = Omit<Lens<A, S>, 'type'>;

export interface PartialLens<A = any, S = any> {
    get: (s: S) => A | undefined;
    set: (a: A, s: S) => S;
    type: 'partial';
    key?: string;
}

type StrictMode = null extends string ? false : true;
export type IsNullable<T> = StrictMode extends false
    ? false
    : null extends T
    ? true
    : undefined extends T
    ? true
    : false;

export type ComposeModifiers<TModifiersA extends Modifiers, TModifiersB extends Modifiers, A> = TModifiersA &
    TModifiersB &
    (IsNullable<A> extends true ? partial : {}) extends infer Final extends Modifiers
    ? Final
    : never;

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type FocusedValue<T, TModifiers extends Modifiers> = Pick<TModifiers, 'map'> extends mapped
    ? T[]
    : Pick<TModifiers, 'partial'> extends partial
    ? T | undefined
    : T;
