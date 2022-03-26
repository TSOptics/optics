import { getFoldGroups, getElemsWithPath, replaceTraversals } from './mapReduce';
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
    reduced,
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
            (acc, cv) => (cv.type === 'reduced' ? false : acc || cv.type === 'mapped'),
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
                const result = aux(isTraversal ? (s as any[]).flat() : s, tl, true);
                this.cache.set(hd, [s, result]);
                return result;
            }
            if (hd.type === 'reduced') {
                const index = hd.get(s);
                if (index === -1) return undefined;
                return aux((s as any[])[index], tl, false);
            }
            const slice = isTraversal
                ? tl.length > 0
                    ? (s as any[]).reduce<any[]>((acc, cv) => {
                          const n = hd.get(cv);
                          if (n !== undefined && n !== null) {
                              acc.push(n);
                          }
                          return acc;
                      }, [])
                    : (s as any[]).map((x) => hd.get(x))
                : hd.get(s);

            if (slice === undefined || slice === null || (slice as any[])?.length === 0) {
                return isOpticTraversal ? [] : tl.length > 0 ? undefined : slice;
            }
            return aux(slice, tl, isTraversal);
        };

        return aux(s, this.lenses);
    };

    set: (a: A | ((prev: A) => A), s: S) => S = (a, s) => {
        const aux = (
            a: A | ((prev: A) => A),
            s: S,
            lenses = this.lenses,
            foldGroups = getFoldGroups(this.lenses),
        ): S => {
            const [hd, ...tl] = lenses;
            const [group, ...groups] = foldGroups;
            if (!hd) return typeof a === 'function' ? (a as (prev: any) => A)(s) : (a as any);
            if (group && hd === group.openingTraversal) {
                const elemsWithPath = getElemsWithPath(s, lenses);
                const elems = elemsWithPath.map(([, elem]) => elem);
                const index: number = group.reduce.get(elems);
                if (index === -1) return s;
                const [path] = elemsWithPath[index];
                const replacedLenses = replaceTraversals(lenses, path);
                return aux(a, s, replacedLenses, groups);
            }
            const slice = hd.get(s);
            if (hd.type === 'mapped') {
                const newSlice = (slice as any[]).map((x) => aux(a, x, tl, foldGroups)) as any;
                return (slice as any[]).every((x, i) => x === newSlice[i]) ? slice : newSlice;
            }
            if (tl.length > 0 && (slice === undefined || slice === null)) return s;
            const newSlice = aux(a, slice, tl, foldGroups);
            if (slice === newSlice) return s;
            return hd.set(newSlice, s);
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

    findFirst: TOpticType extends mapped ? (predicate: (a: A) => boolean) => Optic<A, reduced, S> : never = ((
        predicate: (value: unknown) => boolean,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) => s.findIndex(predicate),
                set: noop,
                type: 'reduced',
                key: 'findFirst',
            },
        ]);
    }) as any;

    maxBy: TOpticType extends mapped ? (f: (a: A) => number) => Optic<A, reduced, S> : never = ((
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
                type: 'reduced',
                key: 'maxBy',
            },
        ]);
    }) as any;

    minBy: TOpticType extends mapped ? (f: (a: A) => number) => Optic<A, reduced, S> : never = ((
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
                type: 'reduced',
                key: 'minBy',
            },
        ]);
    }) as any;

    atIndex: TOpticType extends mapped ? (index: number) => Optic<A, reduced, S> : never = ((index: number) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: A[]) => (index >= 0 && index < s.length ? index : -1),
                set: noop,
                type: 'reduced',
                key: 'atIndex',
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
