import { ArrayOptic, MappedCombinators, Resolve } from './combinators.types';
import { Lens, mapped, OpticScope, partial } from './types';

abstract class CombinatorsImpl<A, TScope extends OpticScope, S> implements MappedCombinators<A, S>, ArrayOptic<any, S> {
    protected abstract lenses: Lens[];
    protected abstract instantiate(newLenses: Lens[]): any;

    map<Elem = A extends (infer R)[] ? R : never>(): Resolve<this, Elem, mapped, S> {
        return this.instantiate([{ get: (s) => s, set: (a) => a, key: 'map', type: 'map' }]);
    }

    reduceFindFirst(predicate: (a: A) => boolean): Resolve<this, A, partial, S> {
        return this.instantiate([
            {
                get: (s: A[]) => s.findIndex(predicate),
                set: noop,
                type: 'fold',
                key: 'findFirst',
            },
        ]);
    }
    reduceMax(...arg: A extends number ? [f?: undefined] : [f: (a: A) => number]): Resolve<this, A, partial, S> {
        return this.instantiate([
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
        return this.instantiate([
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
        return this.instantiate([
            {
                get: (s: A[]) => (index < 0 ? index + s.length : index),
                set: noop,
                type: 'fold',
                key: 'atIndex',
            },
        ]);
    }
    reduceFilter(predicate: (a: A) => boolean): Resolve<this, A, mapped, S> {
        return this.instantiate([
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
        return this.instantiate([
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
        return this.instantiate([
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
}
const noop = () => {};

export default CombinatorsImpl;
