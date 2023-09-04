export interface partial {
    partial: 'partial';
}

export interface total extends partial {
    total: 'total';
}

export interface mapped {
    map: 'map';
}

export type OpticScope = mapped | partial;

export interface Lens<A = any, S = any> {
    key: string;
    get: (s: S) => A;
    set: (a: A, s: S) => S;
    type?: 'fold' | 'foldN' | 'map' | 'nullable' | 'unstable';
}

type StrictMode = null extends string ? false : true;
export type IsNullable<T> = StrictMode extends false
    ? false
    : null extends T
    ? true
    : undefined extends T
    ? true
    : false;

export type ComposeScopes<TScopeA extends OpticScope, TScopeB extends OpticScope, A> = mapped extends TScopeA | TScopeB
    ? mapped
    : partial extends TScopeA | TScopeB
    ? partial
    : IsNullable<A> extends true
    ? partial
    : total;

export type FocusedValue<T, TScope extends OpticScope> = TScope extends mapped
    ? T[]
    : TScope extends total
    ? T
    : T | undefined;

export type ToPartial<TScope extends OpticScope> = TScope extends total ? partial : TScope;
export type FocusToPartial<TScope extends OpticScope, T> = TScope extends total ? T : TScope;

export type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

export type DeriveOpticScope<T, TScope extends OpticScope> = IsNullable<T> extends true
    ? TScope extends partial
        ? partial
        : TScope
    : TScope;
