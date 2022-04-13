export interface partial {
    partial: 'partial';
}

export interface total extends partial {
    total: 'total';
}

export interface mapped {
    map: 'mapped';
}

export type OpticType = mapped | partial;

export interface Lens<A = any, S = any> {
    key: string | symbol;
    get: (s: S) => A;
    set: (a: A, s: S) => S;
    type?: 'fold' | 'mapped';
}

export type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;

type RecursivePath<T, K = Exclude<keyof NonNullable<T>, keyof any[]>> = K extends string
    ? T extends Record<string, any>
        ? K | `${K}${IsNullable<T[K]> extends true ? '?.' : '.'}${RecursivePath<NonNullable<T[K]>>}`
        : never
    : never;

export type Path<T> = T extends any[] ? (T extends [any, ...any] ? RecursivePath<T> : number) : RecursivePath<T>;

export type PathType<T, P extends string | number> = P extends keyof NonNullable<T>
    ? NonNullable<T>[P]
    : P extends `${infer Head}${'.' | '?.'}${infer Tail}`
    ? Head extends keyof NonNullable<T>
        ? PathType<NonNullable<T>[Head], Tail>
        : never
    : never;

export type PathOpticType<T, P extends string | number> = IsNullable<T> extends true
    ? partial
    : P extends `${string}?.${string}`
    ? partial
    : total;

export type ComposedOpticType<TOpticTypeA extends OpticType, TOpticTypeB extends OpticType, A> = mapped extends
    | TOpticTypeA
    | TOpticTypeB
    ? mapped
    : partial extends TOpticTypeA | TOpticTypeB
    ? partial
    : IsNullable<A> extends true
    ? partial
    : total;
