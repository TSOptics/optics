import {
    ArrayCombinators,
    BaseCombinators,
    MappedCombinators,
    NullableCombinators,
    RecordCombinators,
    Resolve,
} from './combinators.types';
import { PureOptic } from './PureOptic.types';
import { ComposedOpticType, Lens, mapped, OpticType, partial, ToPartial } from './types';

abstract class CombinatorsImpl<A, TOpticType extends OpticType, S>
    implements
        BaseCombinators<A, TOpticType, S>,
        ArrayCombinators<A, TOpticType, S>,
        RecordCombinators<A, TOpticType, S>,
        NullableCombinators<A, TOpticType, S>,
        MappedCombinators<A, S>
{
    protected abstract lenses: Lens[];
    protected abstract derive(newLenses: Lens[]): any;

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
    compose<B, TOpticTypeB extends OpticType>(
        other: PureOptic<B, TOpticTypeB, NonNullable<A>>,
    ): PureOptic<B, ComposedOpticType<TOpticType, TOpticTypeB, A>, S> {
        return this.derive([{ get: (s) => s, set: (a) => a, key: 'compose' }, ...(other as unknown as this).lenses]);
    }

    map(): A extends (infer R)[] ? Resolve<this, R, mapped, S> : never {
        return this.derive([{ get: (s) => s, set: (a) => a, key: 'map', type: 'map' }]);
    }

    at(index: number): A extends (infer R)[] ? Resolve<this, R, ToPartial<TOpticType>, S> : never {
        return this.derive([
            {
                get: (s: any[]) => s[index < 0 ? index + s.length : index],
                set: (a, s: any[]) => {
                    const absIndex = index < 0 ? index + s.length : index;
                    return s.map((x, i) => (i === absIndex ? a : x));
                },
                key: 'at',
            },
        ]);
    }

    indexBy<Key extends string | number, Elem = A extends (infer R)[] ? R : never>(
        getKey: (a: Elem) => Key,
    ): Resolve<this, Record<Key, Elem>, TOpticType, S> {
        return this.derive([
            {
                get: (s: any[]) => {
                    return s.reduce((acc, cv) => {
                        acc[getKey(cv)] = cv;
                        return acc;
                    }, {} as Record<Key, any>);
                },
                set: (a: Record<Key, any>, s: any[]) => {
                    const keys = { ...a };
                    return s.reduceRight<any[]>((acc, cv) => {
                        const key = getKey(cv);
                        acc.unshift(keys[key] ?? cv);
                        delete keys[key];
                        return acc;
                    }, []);
                },
                key: 'indexBy',
            },
        ]);
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

    reduceFindFirst(predicate: (a: A) => boolean): Resolve<this, A, partial, S> {
        return this.derive([
            {
                get: (s: A[]) => s.findIndex(predicate),
                set: noop,
                type: 'fold',
                key: 'findFirst',
            },
        ]);
    }
    reduceMax(...arg: A extends number ? [f?: undefined] : [f: (a: A) => number]): Resolve<this, A, partial, S> {
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
    reduceMin(...f: A extends number ? [undefined?] : [(a: A) => number]): Resolve<this, A, partial, S> {
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
    reduceAt(index: number): Resolve<this, A, partial, S> {
        return this.derive([
            {
                get: (s: A[]) => (index < 0 ? index + s.length : index),
                set: noop,
                type: 'fold',
                key: 'atIndex',
            },
        ]);
    }
    reduceFilter(predicate: (a: A) => boolean): Resolve<this, A, mapped, S> {
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
    reduceSlice(start = 0, end?: number | undefined): Resolve<this, A, mapped, S> {
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
    reduceSort(compareFn = (a: any, b: any) => (`${a}` < `${b}` ? -1 : 1)): Resolve<this, A, mapped, S> {
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
}
const noop = () => {};

export default CombinatorsImpl;
