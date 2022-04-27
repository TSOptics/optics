import { getFoldTree } from './fold';
import {
    ComposedOpticType,
    IsNullable,
    Lens,
    partial,
    Path,
    PathOpticType,
    PathType,
    total,
    mapped,
    OpticType,
} from './types';
import { noop, stabilize } from './utils';

export class Optic<A, TOpticType extends OpticType = total, S = any> {
    private lenses: Lens[];
    private cache: Map<Lens, [key: any[], value: any]> = new Map();
    constructor(lenses: Lens[]) {
        this.lenses = lenses;
    }

    get: (s: S) => TOpticType extends mapped ? A[] : TOpticType extends total ? A : A | undefined = (s) => {
        const isOpticTraversal = this.lenses.reduce(
            (acc, cv) => (cv.type === 'fold' ? false : acc || cv.type === 'mapped'),
            false,
        );
        const aux = (s: any, lenses: Lens[], isTraversal = false): any => {
            const [hd, ...tl] = lenses;
            if (!hd) {
                return s;
            }
            if (hd.type === 'mapped') {
                const traversalCache = this.cache.get(hd);
                if (!isTraversal && traversalCache) {
                    const [cacheKey, cacheValue] = traversalCache;
                    if (cacheKey === s) return cacheValue;
                }
                const slice = hd.get(s) as any[];
                const flattened = isTraversal ? slice.flat() : slice;
                const filtered =
                    tl[0]?.type !== 'fold' ? flattened.filter((x) => x !== undefined && x !== null) : flattened;
                const result = filtered.length > 0 ? aux(isTraversal ? filtered : s, tl, true) : undefined;
                this.cache.set(hd, [s, result]);
                return result;
            }
            if (hd.type === 'fold') {
                const index: number | number[] = hd.get(s);
                if (Array.isArray(index)) {
                    if (index.length === 0) return [];
                    const projection = Array(index.length)
                        .fill(undefined)
                        .map((_, i) => s[index[i]]);
                    return aux(projection, tl, true);
                }
                if (index === -1) return undefined;
                return aux((s as any[])[index], tl, false);
            }
            if (isTraversal) {
                const slice = (s as any[]).map(hd.get);
                const filtered = tl[0]?.type !== 'fold' ? slice.filter((x) => x !== undefined && x !== null) : slice;
                return filtered.length > 0 ? aux(filtered, tl, isTraversal) : undefined;
            }
            const slice = hd.get(s);
            return slice === undefined || slice === null ? slice : aux(slice, tl, isTraversal);
        };

        const result = aux(s, this.lenses);
        return isOpticTraversal && (result === undefined || result === null) ? [] : result;
    };

    set: (a: A | ((prev: A) => A), s: S) => S = (a, s) => {
        const aux = (a: A | ((prev: A) => A), s: S, lenses = this.lenses, foldTree = getFoldTree(lenses, s)): S => {
            const [lens, ...tailLenses] = lenses;
            if (!lens) return typeof a === 'function' ? (a as (prev: any) => A)(s) : (a as any);
            if (lens.type === 'fold') {
                return aux(a, s, tailLenses);
            }
            const slice = lens.get(s);
            if (lens.type === 'mapped') {
                if (foldTree) {
                    return (slice as any[]).map((x, index) =>
                        foldTree[index] ? aux(a, x, tailLenses, foldTree[index]) : x,
                    ) as any;
                } else {
                    const newSlice = (slice as any[]).map((x) =>
                        tailLenses.length > 0 && (x === undefined || x === null) ? x : aux(a, x, tailLenses, foldTree),
                    );
                    return (slice as any[]).every((x, i) => x === newSlice[i]) ? slice : newSlice;
                }
            }
            if (tailLenses.length > 0 && (slice === undefined || slice === null)) return s;
            const newSlice = aux(a, slice, tailLenses, foldTree);
            if (slice === newSlice) return s;
            return lens.set(newSlice, s);
        };

        return aux(a, s);
    };

    focus: <TPath extends Path<A>>(
        path: TPath,
    ) => Optic<PathType<A, TPath>, TOpticType extends total ? PathOpticType<A, TPath> : TOpticType, S> = (path) => {
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
            TOpticType extends total ? (IsNullable<A> extends true ? partial : total) : TOpticType,
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

    compose: <B, TOpticTypeB extends OpticType>(
        other: Optic<B, TOpticTypeB, NonNullable<A>>,
    ) => ComposedOpticType<TOpticType, TOpticTypeB, A> extends never
        ? void
        : Optic<B, ComposedOpticType<TOpticType, TOpticTypeB, A>, S> = (other) => {
        return new Optic([...this.lenses, ...other.lenses]) as any;
    };

    refine: <B>(
        refiner: (a: A) => B | false,
    ) => B extends false ? never : Optic<B, TOpticType extends total ? partial : TOpticType, S> = (refiner) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => (refiner(s) === false ? undefined : s),
                set: (a, s) => (refiner(s) === false ? s : a),
                key: 'refine',
            },
        ]) as any;
    };

    convert: <B>(get: (a: A) => B, reverseGet: (b: B) => A) => Optic<B, TOpticType, S> = (get, reverseGet) => {
        return new Optic([...this.lenses, { get: stabilize(get), set: reverseGet, key: 'convert' }]);
    };

    map: A extends readonly (infer R)[] ? () => Optic<R, mapped, S> : never = (() => {
        return new Optic([...this.lenses, { get: (s) => s, set: (a) => a, key: 'map', type: 'mapped' }]);
    }) as any;

    if: (predicate: (a: A) => boolean) => Optic<A, TOpticType extends total ? partial : TOpticType, S> = (
        predicate,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => (predicate(s) === true ? s : undefined),
                set: (a, s) => (predicate(s) === true ? a : s),
                key: 'if',
            },
        ]);
    };

    // FOLDS

    findFirst: TOpticType extends mapped ? (predicate: (a: A) => boolean) => Optic<A, partial, S> : never = ((
        predicate: (value: unknown) => boolean,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) => s.findIndex(predicate),
                set: noop,
                type: 'fold',
                key: 'findFirst',
            },
        ]);
    }) as any;

    maxBy: TOpticType extends mapped ? (f: (a: A) => number) => Optic<A, partial, S> : never = ((
        f: (a: A) => number,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) =>
                    s.reduce<{ maxValue: number; indexOfMax: number }>(
                        ({ maxValue, indexOfMax }, cv: A, ci) => {
                            const numValue = f(cv);
                            return {
                                maxValue: numValue > maxValue ? numValue : maxValue,
                                indexOfMax: numValue > maxValue ? ci : indexOfMax,
                            };
                        },
                        { maxValue: Number.MIN_VALUE, indexOfMax: -1 },
                    ).indexOfMax,
                set: noop,
                type: 'fold',
                key: 'maxBy',
            },
        ]);
    }) as any;

    minBy: TOpticType extends mapped ? (f: (a: A) => number) => Optic<A, partial, S> : never = ((
        f: (a: A) => number,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) =>
                    s.reduce<{ minValue: number; indexOfMin: number }>(
                        ({ minValue, indexOfMin }, cv: A, ci) => {
                            const numValue = f(cv);
                            return {
                                minValue: numValue < minValue ? numValue : minValue,
                                indexOfMin: numValue < minValue ? ci : indexOfMin,
                            };
                        },
                        { minValue: Number.MAX_VALUE, indexOfMin: -1 },
                    ).indexOfMin,
                set: noop,
                type: 'fold',
                key: 'minBy',
            },
        ]);
    }) as any;

    atIndex: TOpticType extends mapped ? (index: number) => Optic<A, partial, S> : never = ((index: number) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) => (index >= 0 && index < s.length ? index : -1),
                set: noop,
                type: 'fold',
                key: 'atIndex',
            },
        ]);
    }) as any;

    filter: TOpticType extends mapped ? (predicate: (a: A) => boolean) => Optic<A, mapped, S> : never = ((
        predicate: (a: A) => boolean,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) =>
                    s.reduce((acc, cv, ci) => {
                        if (predicate(cv)) acc.push(ci);
                        return acc;
                    }, [] as number[]),
                set: noop,
                type: 'fold',
                key: 'filter',
            },
        ]);
    }) as any;

    slice: TOpticType extends mapped ? (start?: number, end?: number) => Optic<A, mapped, S> : never = ((
        start = 0,
        end?: number,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) => {
                    const startAbs = start < 0 ? s.length + start : start;
                    const endAbs = end === undefined ? s.length : end < 0 ? s.length + end : end;
                    if (startAbs >= endAbs) return [];
                    return Array(endAbs - startAbs)
                        .fill(undefined)
                        .map((_, i) => i + startAbs);
                },
                set: noop,
                type: 'fold',
                key: `slice from ${start ?? 0} to ${end ?? 'end'}`,
            },
        ]);
    }) as any;

    sort: TOpticType extends mapped ? (compareFn?: (a: A, b: A) => number) => Optic<A, mapped, S> : never = ((
        compareFn = (a: any, b: any) => (`${a}` < `${b}` ? -1 : 1),
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) =>
                    Object.entries(s)
                        .sort(([, valueA], [, valueB]) => compareFn(valueA, valueB))
                        .map(([index]) => index),
                set: noop,
                type: 'fold',
                key: 'sort',
            },
        ]);
    }) as any;

    atKey: A extends Record<string, infer R>
        ? (key: string) => Optic<R, TOpticType extends total ? partial : TOpticType, S>
        : never = ((key: string) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => s[key],
                set: (a, s) => (s[key] !== undefined ? { ...s, [key]: a } : s),
                key: `record key: ${key}`,
            },
        ]);
    }) as any;

    toPartial: TOpticType extends total ? () => Optic<NonNullable<A>, partial, S> : never = (() =>
        new Optic([...this.lenses])) as any;

    focusWithDefault: <Prop extends keyof NonNullable<A>>(
        prop: Prop,
        fallback: (parent: A) => NonNullable<NonNullable<A>[Prop]>,
    ) => Optic<NonNullable<NonNullable<A>[Prop]>, TOpticType, S> = (key, fallback) => {
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

    ˍˍunsafeGetLenses = () => this.lenses;

    ˍˍcovariance: () => TOpticType | null = () => null;
}
