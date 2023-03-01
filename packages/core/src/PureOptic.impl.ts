import { getFoldTree, isFold } from './fold';
import {
    PureOpticInterface,
    Mapped,
    OnArray,
    OnNullable,
    OnRecord,
    PureOptic,
    Resolve,
    ToPartial,
} from './PureOptic.types';
import { ComposedOpticType, FocusedValue, Lens, mapped, OpticType, partial } from './types';

class PureOpticImpl<A, TOpticType extends OpticType, S>
    implements
        PureOpticInterface<A, TOpticType, S>,
        OnArray<A, S>,
        OnRecord<A, TOpticType, S>,
        OnNullable<A, TOpticType, S>,
        Mapped<A, S>
{
    protected lenses: Lens[];
    constructor(lenses: Lens[]) {
        this.lenses = lenses;
        return new Proxy(this, {
            get(target: any, prop: any) {
                if (target[prop] !== undefined) {
                    return target[prop];
                }
                if (typeof prop === 'symbol') return;
                return (target as PureOpticImpl<any, OpticType, any>).derive([
                    {
                        key: 'focus ' + prop,
                        get: (s) => s[prop],
                        set: (a, s) =>
                            Array.isArray(s) ? [...s.slice(0, prop), a, ...s.slice(prop + 1)] : { ...s, [prop]: a },
                    },
                ]);
            },
        });
    }

    protected _get(s: S, earlyReturn?: (s: any, lens: Lens) => any | undefined): FocusedValue<A, TOpticType> {
        const aux = (s: any, lenses: Lens[], isTraversal = false): any => {
            const [lens, ...tailLenses] = lenses;
            if (!lens || ((s === undefined || s === null) && lens.type !== 'nullable')) {
                return s;
            }
            const a = earlyReturn?.(s, lens);
            if (a !== undefined) {
                return a;
            }
            if (lens.type === 'map') {
                const slice = lens.get(s) as any[];
                const flattened = isTraversal ? slice.flat() : slice;
                const filtered =
                    tailLenses[0] && !isFold(tailLenses[0])
                        ? flattened.filter((x) => x !== undefined && x !== null)
                        : flattened;
                const result = filtered.length > 0 ? aux(filtered, tailLenses, true) : undefined;
                return result;
            }
            if (lens.type === 'fold') {
                const index: number = lens.get(s);
                if (index === -1) return undefined;
                return aux((s as any[])[index], tailLenses, false);
            }
            if (lens.type === 'foldN') {
                const indexes: number[] = lens.get(s);
                if (indexes.length === 0) return [];
                const projection = Array(indexes.length)
                    .fill(undefined)
                    .map((_, i) => s[indexes[i]]);
                return aux(projection, tailLenses, true);
            }
            if (isTraversal) {
                const slice = (s as any[]).map(lens.get);
                const filtered = !isFold(tailLenses[0]) ? slice.filter((x) => x !== undefined && x !== null) : slice;
                return filtered.length > 0 ? aux(filtered, tailLenses, isTraversal) : undefined;
            }
            const slice = lens.get(s);
            return aux(slice, tailLenses, isTraversal);
        };

        const result = aux(s, this.lenses);
        return (result === undefined || result === null) && this.isMapped() ? [] : result;
    }
    get(s: S): FocusedValue<A, TOpticType> {
        return this._get(s);
    }

    set(a: A | ((prev: A) => A), s: S): S {
        const aux = (a: A | ((prev: A) => A), s: S, lenses = this.lenses, foldTree = getFoldTree(lenses, s)): S => {
            const [lens, ...tailLenses] = lenses;
            if (!lens) return typeof a === 'function' ? (a as (prev: any) => A)(s) : (a as any);
            if (isFold(lens)) {
                return aux(a, s, tailLenses);
            }
            const slice = lens.get(s);
            if ((slice === undefined || slice === null) && tailLenses.length > 0 && tailLenses[0].type !== 'nullable')
                return s;
            if (lens.type === 'map') {
                const newSlice = foldTree
                    ? (slice as any[]).map((x, index) => (foldTree[index] ? aux(a, x, tailLenses, foldTree[index]) : x))
                    : (slice as any[]).map((x) =>
                          tailLenses.length > 0 && (x === undefined || x === null)
                              ? x
                              : aux(a, x, tailLenses, foldTree),
                      );
                return (slice as any[]).some((x, i) => x !== newSlice[i]) ? lens.set(newSlice, s) : (s as any);
            }

            const newSlice = aux(a, slice, tailLenses, foldTree);
            if (slice === newSlice) return s;
            return lens.set(newSlice, s);
        };

        return aux(a, s);
    }

    compose<B, TOpticTypeB extends OpticType>(
        other: PureOptic<B, TOpticTypeB, NonNullable<A>>,
    ): Resolve<this, B, ComposedOpticType<TOpticType, TOpticTypeB, A>, S> {
        return this.derive([
            { get: (s) => s, set: (a) => a, key: 'compose' },
            ...(other as PureOpticImpl<B, TOpticTypeB, NonNullable<A>>).lenses,
        ]);
    }
    refine<B>(
        refiner: (a: NonNullable<A>) => false | B,
    ): B extends false ? never : Resolve<this, B, ToPartial<TOpticType>, S> {
        return this.derive([
            {
                get: (s) => (refiner(s) !== false ? s : undefined),
                set: (a, s) => (refiner(s) !== false ? a : s),
                key: 'refine',
            },
        ]);
    }
    if(predicate: (a: NonNullable<A>) => boolean): Resolve<this, A, ToPartial<TOpticType>, S> {
        return this.derive([
            {
                get: (s) => (predicate(s) === true ? s : undefined),
                set: (a, s) => (predicate(s) === true ? a : s),
                key: 'if',
            },
        ]);
    }
    convert<B>(to: (a: NonNullable<A>) => B, from: (b: B) => A): Resolve<this, B, TOpticType, S> {
        return this.derive([{ get: to, set: from, key: 'convert' }]);
    }

    map(): A extends (infer R)[] ? Resolve<this, R, mapped, S> : never {
        return this.derive([{ get: (s) => s, set: (a) => a, key: 'map', type: 'map' }]);
    }

    values(): A extends Record<string, infer R> ? Resolve<this, Array<R>, TOpticType, S> : never {
        return this.derive([
            {
                get: (s) => Object.values(s),
                set: (a, s) => {
                    const keys = Object.keys(s);
                    return keys.reduce((acc, key, index) => {
                        acc[key] = a[index];
                        return acc;
                    }, {} as Record<string, any>);
                },
                key: 'values',
            },
        ]);
    }
    entries(): A extends Record<string, infer R> ? Resolve<this, Array<readonly [string, R]>, TOpticType, S> : never {
        return this.derive([
            {
                get: (s) => Object.entries(s),
                set: (a) => Object.fromEntries(a),
                key: 'entries',
            },
        ]);
    }

    findFirst(predicate: (a: A) => boolean): Resolve<this, A, partial, S> {
        return this.derive([
            {
                get: (s: A[]) => s.findIndex(predicate),
                set: noop,
                type: 'fold',
                key: 'findFirst',
            },
        ]);
    }
    max(...arg: A extends number ? [f?: undefined] : [f: (a: A) => number]): Resolve<this, A, partial, S> {
        return this.derive([
            {
                get: (s: A[]) =>
                    s.reduce<{ maxValue: number; indexOfMax: number }>(
                        ({ maxValue, indexOfMax }, cv: A, ci) => {
                            const numValue = arg[0]?.(cv) ?? (cv as number);
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
    }
    min(...f: A extends number ? [undefined?] : [(a: A) => number]): Resolve<this, A, partial, S> {
        return this.derive([
            {
                get: (s: A[]) =>
                    s.reduce<{ minValue: number; indexOfMin: number }>(
                        ({ minValue, indexOfMin }, cv: A, ci) => {
                            const numValue = f[0]?.(cv) ?? (cv as number);
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
    }
    at(index: number): Resolve<this, A, partial, S> {
        return this.derive([
            {
                get: (s: A[]) => (index < 0 ? index + s.length : index),
                set: noop,
                type: 'fold',
                key: 'atIndex',
            },
        ]);
    }
    filter(predicate: (a: A) => boolean): Resolve<this, A, mapped, S> {
        return this.derive([
            {
                get: (s: A[]) =>
                    s.reduce((acc, cv, ci) => {
                        if (predicate(cv)) acc.push(ci);
                        return acc;
                    }, [] as number[]),
                set: noop,
                type: 'foldN',
                key: 'filter',
            },
        ]);
    }
    slice(start = 0, end?: number | undefined): Resolve<this, A, mapped, S> {
        return this.derive([
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
                type: 'foldN',
                key: `slice from ${start ?? 0} to ${end ?? 'end'}`,
            },
        ]);
    }
    sort(compareFn = (a: any, b: any) => (`${a}` < `${b}` ? -1 : 1)): Resolve<this, A, mapped, S> {
        return this.derive([
            {
                get: (s: A[]) =>
                    Object.entries(s)
                        .sort(([, valueA], [, valueB]) => compareFn(valueA, valueB))
                        .map(([index]) => index),
                set: noop,
                type: 'foldN',
                key: 'sort',
            },
        ]);
    }
    toPartial(): Resolve<this, NonNullable<A>, ToPartial<TOpticType>, S> {
        return this.derive([{ get: (s) => s, set: (a) => a, key: 'toPartial' }]);
    }
    default(fallback: () => NonNullable<A>): Resolve<this, NonNullable<A>, TOpticType, S> {
        return this.derive([
            {
                key: 'default',
                type: 'nullable',
                get: (s) => {
                    return s === null || s === undefined ? fallback() : s;
                },
                set: (a) => a,
            },
        ]);
    }

    protected derive(newLenses: Lens[]): any {
        return new PureOpticImpl([...this.lenses, ...newLenses]);
    }
    private isMapped(): boolean {
        return this.lenses.reduce(
            (acc, cv) => (cv.type === 'fold' ? false : acc || cv.type === 'map' || cv.type === 'foldN'),
            false,
        );
    }
    private toString(): string {
        return this.lenses.map((l) => l.key.toString()).toString();
    }
}

const noop = () => {};

export default PureOpticImpl;
