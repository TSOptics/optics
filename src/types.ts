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
    key: string | symbol;
    get: (s: S) => A;
    set: (a: A, s: S) => S;
    type?: 'fold' | 'foldN' | 'map';
}

type StrictMode = null extends string ? false : true;
export type IsNullable<T> = StrictMode extends false
    ? false
    : null extends T
    ? true
    : undefined extends T
    ? true
    : false;

type Append<T, Path extends string, Key extends string> = Path extends ''
    ? Key
    : `${Path}${IsNullable<T> extends true ? '?.' : '.'}${Key}`;
type IsArray<T> = [T] extends [readonly any[]] ? ('0' extends T ? false : true) : false;
type TailRecursivePath<T, Acc = never, Path = '', Key = Exclude<keyof NonNullable<T>, keyof any[]>> = Key extends string
    ? [NonNullable<T>] extends [Record<string, any>]
        ? [Acc] extends [string]
            ? [Path] extends [string]
                ? IsArray<NonNullable<NonNullable<T>[Key]>> extends true
                    ? Acc | Append<T, Path, Key>
                    : TailRecursivePath<NonNullable<T>[Key], Acc | Path, Append<T, Path, Key>>
                : never
            : never
        : Acc | Path
    : never;

type RecursivePath<T, K = Exclude<keyof NonNullable<T>, keyof any[] | keyof Date>> = K extends string
    ? [T] extends [Record<string, any>]
        ?
              | K
              | `${K}${IsNullable<T[K]> extends true ? '?.' : '.'}${T[K] extends null | undefined
                    ? never
                    : RecursivePath<NonNullable<T[K]>>}`
        : never
    : never;

export type Path<T> = any[] extends T ? (T extends [any, ...any] ? RecursivePath<T> : number) : RecursivePath<T>;

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

export type FocusedValue<T, TOpticType extends OpticType> = TOpticType extends mapped
    ? T[]
    : TOpticType extends total
    ? T
    : T | undefined;
