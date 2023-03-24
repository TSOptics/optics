export interface partial {
    partial: 'partial';
}

export interface total extends partial {
    total: 'total';
}

export interface mapped {
    map: 'map';
}

export type OpticType = mapped | partial;

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

export type ComposedOpticType<TOpticTypeA extends OpticType, TOpticTypeB extends OpticType, A> = mapped extends
    | TOpticTypeA
    | TOpticTypeB
    ? mapped
    : partial extends TOpticTypeA | TOpticTypeB
    ? partial
    : IsNullable<A> extends true
    ? partial
    : total;

export type FocusedValue<T, TOpticType extends OpticType> = TOpticType extends mapped
    ? T[]
    : TOpticType extends total
    ? T
    : T | undefined;

export type ToPartial<TOpticType extends OpticType> = TOpticType extends total ? partial : TOpticType;
export type FocusToPartial<TOpticType extends OpticType, T> = TOpticType extends total ? T : TOpticType;

export type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

export type DeriveOpticType<T, TOpticType extends OpticType> = IsNullable<T> extends true
    ? TOpticType extends partial
        ? partial
        : TOpticType
    : TOpticType;
