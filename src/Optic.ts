import { stabilize } from './utils';

export interface partial {
    partial: 'partial';
}
export interface total extends partial {
    total: 'total';
}

export interface Lens<A = any, S = any> {
    key: string | symbol;
    get: (s: S) => A;
    set: (a: A, s: S) => S;
}

type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;

type RecursivePath<T, K = Exclude<keyof NonNullable<T>, keyof any[]>> = K extends string
    ? T extends Record<string, any>
        ? K | `${K}${IsNullable<T[K]> extends true ? '?.' : '.'}${RecursivePath<NonNullable<T[K]>>}`
        : never
    : never;

type Path<T> = T extends any[] ? (T extends [any, ...any] ? RecursivePath<T> : number) : RecursivePath<T>;

type PathType<T, P extends string | number> = P extends keyof NonNullable<T>
    ? NonNullable<T>[P]
    : P extends `${infer Head}${'.' | '?.'}${infer Tail}`
    ? Head extends keyof NonNullable<T>
        ? PathType<NonNullable<T>[Head], Tail>
        : never
    : never;

type PathCompleteness<T, P extends string | number> = IsNullable<T> extends true
    ? partial
    : P extends `${string}?.${string}`
    ? partial
    : total;

export class Optic<A, Completeness extends partial = total, S = any> {
    private lenses: Lens[];
    constructor(lenses: Lens[]) {
        this.lenses = lenses;
    }

    get: (s: S) => Completeness extends total ? A : A | undefined = (s) => {
        let accumulator: any = s;
        for (const lens of this.lenses) {
            const slice = lens.get(accumulator);
            if (slice === undefined || slice === null) {
                return slice;
            }
            accumulator = slice;
        }
        return accumulator;
    };

    set: (a: A, s: S) => S = (a, s) => {
        const aux = (a: A, s: S, lenses = this.lenses): S => {
            const [hd, ...tl] = lenses;
            if (!hd) return a as any;
            const slice = hd.get(s);
            if (tl.length > 0 && (slice === undefined || slice === null)) return s;
            const newSlice = aux(a, slice, tl);
            if (slice === newSlice) return s;
            return hd.set(newSlice, s);
        };
        return aux(a, s);
    };

    focus: <TPath extends Path<A>>(
        path: TPath,
    ) => Optic<PathType<A, TPath>, Completeness extends total ? PathCompleteness<A, TPath> : partial, S> = (path) => {
        if (typeof path === 'number')
            return new Optic([
                ...this.lenses,
                {
                    get: (s) => s[path],
                    set: (a, s) => [...s.slice(0, path), a, ...s.slice(path + 1)],
                    key: 'focus index ' + path,
                },
            ]);
        return new Optic([
            ...this.lenses,
            ...path.split(/\.|\?\./).map<Lens>((key: any) => ({
                key: 'focus ' + key,
                get: (s) => s[key],
                set: (a, s) => (Array.isArray(s) ? [...s.slice(0, key), a, ...s.slice(key + 1)] : { ...s, [key]: a }),
            })),
        ]);
    };

    focusMany: <Keys extends keyof NonNullable<A>, Prefix extends string | undefined>(
        props: Keys[],
        prefix?: Prefix,
    ) => {
        [Key in Keys as `${undefined extends Prefix ? 'on' : Prefix}${Key extends number
            ? Key
            : Capitalize<Key & string>}`]-?: Optic<
            NonNullable<A>[Key],
            undefined extends A ? partial : null extends A ? partial : Completeness,
            S
        >;
    } = (props, prefix) => {
        return props.reduce((acc, prop) => {
            const propName = prop.toString();
            const firstLetter = prefix !== '' ? propName.charAt(0).toUpperCase() : propName.charAt(0);
            acc[(prefix ?? 'on') + firstLetter + propName.slice(1)] = this.focus(prop as any);
            return acc;
        }, {} as any);
    };

    getKeys = () => {
        return this.lenses.map((l) => l.key);
    };

    compose: <B, CompletenessB extends partial>(
        other: Optic<B, CompletenessB, NonNullable<A>>,
    ) => Optic<B, Completeness extends total ? (IsNullable<A> extends false ? CompletenessB : partial) : partial, S> = (
        other,
    ) => {
        return new Optic([...this.lenses, ...other.lenses]) as any;
    };

    refine: <B>(refiner: (a: A) => B | false) => B extends false ? never : Optic<B, partial, S> = (refiner) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => (refiner(s) === false ? undefined : s),
                set: (a, s) => (refiner(s) === false ? s : a),
                key: 'refine',
            },
        ]) as any;
    };

    convert: <B>(get: (a: A) => B, reverseGet: (b: B) => A) => Optic<B, Completeness, S> = (get, reverseGet) => {
        return new Optic([...this.lenses, { get: stabilize(get), set: reverseGet, key: 'convert' }]);
    };

    filter: (predicate: (a: A) => boolean) => Optic<A, partial, S> = (predicate) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => (predicate(s) === true ? s : undefined),
                set: (a, s) => (predicate(s) === true ? a : s),
                key: 'filter',
            },
        ]);
    };

    findFirst: A extends Array<infer R> ? (predicate: (r: R) => boolean) => Optic<R, partial, S> : never = ((
        predicate: (value: unknown) => boolean,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: unknown[]) => s.find(predicate),
                set: (a: unknown, s: unknown[]) => {
                    const i = s.findIndex(predicate);
                    if (i === -1) return s;
                    return [...s.slice(0, i), a, ...s.slice(i + 1)];
                },
                key: 'findFirst',
            },
        ]);
    }) as any;

    atKey: A extends Record<string, infer R> ? (key: string) => Optic<R, partial, S> : never = ((key: string) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => s[key],
                set: (a, s) => (s[key] !== undefined ? { ...s, [key]: a } : s),
                key: `record key: ${key}`,
            },
        ]);
    }) as any;

    toPartial: () => Optic<NonNullable<A>, partial, S> = () => new Optic([...this.lenses]);

    focusWithDefault: <Prop extends keyof NonNullable<A>>(
        prop: Prop,
        fallback: (parent: A) => NonNullable<NonNullable<A>[Prop]>,
    ) => Optic<NonNullable<NonNullable<A>[Prop]>, Completeness, S> = (key, fallback) => {
        return new Optic([
            ...this.lenses,
            {
                get: stabilize((s) => {
                    const slice = s[key];
                    return slice !== undefined && slice !== null ? slice : fallback(s);
                }),
                set: (a, s) => ({ ...s, [key]: a }),
                key: `focus ${key} with default`,
            },
        ]) as any;
    };

    toString() {
        return this.getKeys().toString();
    }

    ˍˍunsafeReplaceLast = (newLast: Lens<A>) => {
        this.lenses[this.lenses.length - 1] = newLast;
    };

    ˍˍunsafeGetFirstLens = () => this.lenses[0];

    ˍˍcovariance: () => Completeness | null = () => null;
}

export function optic<A, S>(get: (s: S) => A, set: (a: A, s: S) => S, key?: string): Optic<A, total, S>;
export function optic<S>(key?: string): Optic<S, total, S>;
export function optic<A, S>(
    getOrKey?: string | ((s: S) => A),
    set?: (a: A, s: S) => S,
    key?: string,
): Optic<A, total, S> {
    if (typeof getOrKey === 'function') {
        return new Optic([{ get: stabilize(getOrKey), set: set as any, key: key ?? 'custom optic' }]);
    }
    return new Optic([{ get: (s) => s, set: (a) => a, key: getOrKey || 'custom optic' }]);
}

export function opticPartial<A, S>(
    get: (s: S) => A | undefined,
    set: (a: A, s: S) => S,
    key?: string,
): Optic<A, partial, S>;
export function opticPartial<S>(key?: string): Optic<S, partial, S>;
export function opticPartial<A, S>(
    getOrKey?: string | ((s: S) => A),
    set?: (a: A, s: S) => S,
    key?: string,
): Optic<A, partial, S> {
    if (typeof getOrKey === 'function') {
        return new Optic([{ get: stabilize(getOrKey), set: set as any, key: key ?? 'custom partial optic' }]);
    }
    return new Optic([{ get: (s) => s, set: (a) => a, key: getOrKey || 'custom partial optic' }]);
}
