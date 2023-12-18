import {
    at,
    cond,
    entries,
    find,
    indexBy,
    max,
    min,
    refine,
    reverse,
    slice,
    sort,
    toPartial,
    values,
} from '../combinators';
import { focusOn } from '../focusOn';

describe('combinators', () => {
    describe('cond', () => {
        const evenNumberOptic = focusOn<number>().derive(cond((n) => n % 2 === 0));

        const majorNameOptic = focusOn<{ age: number; name: string }>().derive(cond(({ age }) => age >= 18)).name;
        const major = { age: 42, name: 'Louis' };
        const minor = { age: 15, name: 'Killian' };
        it('should get result with predicate true', () => {
            expect(evenNumberOptic.get(2)).toBe(2);
            expect(evenNumberOptic.set(4, 2)).toBe(4);

            expect(majorNameOptic.get(major)).toBe('Louis');
            expect(majorNameOptic.set('François', major)).toStrictEqual({ name: 'François', age: 42 });
        });
        it('should return undefined with predicate false', () => {
            expect(evenNumberOptic.get(3)).toBeUndefined();
            expect(evenNumberOptic.set(2, 3)).toBe(3);

            expect(majorNameOptic.get(minor)).toBeUndefined();
            expect(majorNameOptic.set('Titouan', minor)).toBe(minor);
        });
    });
    describe('refine', () => {
        type FooBar = { type: 'foo'; foo: string } | { type: 'bar'; bar: number };
        const foo: FooBar = { type: 'foo', foo: 'test' };
        it('should focus on a part of the union', () => {
            const fooOptic = focusOn<FooBar>().derive(refine((a) => a.type === 'foo' && a));
            expect(fooOptic.get(foo)?.foo).toBe('test');

            const updated = fooOptic.set({ type: 'foo', foo: 'newFoo' }, foo);
            expect(fooOptic.get(updated)?.foo).toBe('newFoo');
        });
        it('should handle the type narrowing failing', () => {
            const barOptic = focusOn<FooBar>().derive(refine((a) => a.type === 'bar' && a));
            expect(barOptic.get(foo)).toBeUndefined();
            expect(barOptic.set({ type: 'bar', bar: 99 }, foo)).toBe(foo);
        });
    });

    describe('toPartial', () => {
        it('should turn a total optic focused on a nullable type to a partial optic focused on the same type but non nullable', () => {
            const aOptic = focusOn<{ a?: number }>().a.derive(toPartial());
            expect(aOptic.get({ a: undefined })).toBe(undefined);
            expect(aOptic.set((prev) => prev + 10, { a: undefined })).toEqual({ a: undefined });
            expect(aOptic.set((prev) => prev + 10, { a: 42 })).toEqual({ a: 52 });

            const bOptic = focusOn<{ a?: { b?: number } }>().a.b.derive(toPartial());
            expect(bOptic.get({ a: { b: undefined } })).toBe(undefined);
            expect(bOptic.set((prev) => prev + 10, { a: { b: undefined } })).toEqual({ a: { b: undefined } });
            expect(bOptic.set((prev) => prev + 10, { a: { b: 42 } })).toEqual({ a: { b: 52 } });

            const asOptic = focusOn<{ a?: number }[]>().map().a.derive(toPartial());
            expect(asOptic.get([{ a: undefined }, { a: 42 }])).toEqual([42]);
            expect(asOptic.set((prev) => prev + 10, [{ a: undefined }, { a: 42 }])).toEqual([
                { a: undefined },
                { a: 52 },
            ]);
        });
    });
    describe('array combinators', () => {
        describe('at', () => {
            const state = [0, 1, 2, 3];
            const stateOptic = focusOn<typeof state>();
            it('should focus the element at index', () => {
                expect(stateOptic.derive(at(3)).get(state)).toBe(3);
                expect(stateOptic.derive(at(3)).set(42, state)).toEqual([0, 1, 2, 42]);
            });
            it('should focus undefined if out of range', () => {
                expect(stateOptic.derive(at(4)).get(state)).toBe(undefined);
                expect(stateOptic.derive(at(4)).set(42, state)).toEqual([0, 1, 2, 3]);
            });
            it('should count from the end with negative index', () => {
                expect(stateOptic.derive(at(-4)).get(state)).toBe(0);
                expect(stateOptic.derive(at(-4)).set(42, state)).toEqual([42, 1, 2, 3]);
            });
        });
        describe('indexBy', () => {
            const state = ['earth', 'wind', 'fire', 'water'];
            const stateOptic = focusOn<typeof state>();
            const indexedStateOptic = stateOptic.derive(indexBy((x) => x[0]));
            it('should take last element in case of collision', () => {
                expect(indexedStateOptic.get(state)).toEqual({ e: 'earth', f: 'fire', w: 'water' });
                const newState = indexedStateOptic.set({ e: 'terre', f: 'feu', w: 'eau' }, state);
                expect(newState).toEqual(['terre', 'wind', 'feu', 'eau']);
                expect(indexedStateOptic.get(newState)).toEqual({ t: 'terre', w: 'wind', f: 'feu', e: 'eau' });
            });
        });
        describe('find', () => {
            const state = [0, 1, 2, 3];
            const stateOptic = focusOn<typeof state>();
            it('should focus the first element matching predicate', () => {
                const firstEvenOptic = stateOptic.derive(find((x) => x % 2 === 0));
                expect(firstEvenOptic.get(state)).toBe(0);

                const newState = firstEvenOptic.set(43, state);
                expect(newState).toEqual([43, 1, 2, 3]);
                expect(firstEvenOptic.get(newState)).toBe(2);
            });
            it('should focus undefined if no element matches', () => {
                const over10Optic = stateOptic.derive(find((x) => x > 10));
                expect(over10Optic.get(state)).toBe(undefined);
                expect(over10Optic.set(42, state)).toEqual([0, 1, 2, 3]);
            });
        });
        describe('max', () => {
            const state = [0, 1, 2, 3];
            const stateOptic = focusOn<typeof state>();
            it('should focus the maximum element', () => {
                const maxOptic = stateOptic.derive(max());
                expect(maxOptic.get(state)).toBe(3);

                const newState = maxOptic.set(-1, state);
                expect(newState).toEqual([0, 1, 2, -1]);
                expect(maxOptic.get(newState)).toBe(2);
            });
            it('should focus undefined if empty', () => {
                const maxOptic = stateOptic.derive(max());
                expect(maxOptic.get([])).toBe(undefined);
                expect(maxOptic.set(42, [])).toEqual([]);
            });
            it('should use custom number getter if provided', () => {
                const state = [{ a: 0 }, { a: 1 }, { a: 2 }, { a: 3 }];
                const stateOptic = focusOn<typeof state>();
                const maxOptic = stateOptic.derive(max((x) => x.a));
                expect(maxOptic.get(state)).toEqual({ a: 3 });

                const newState = maxOptic.set({ a: -1 }, state);
                expect(newState).toEqual([{ a: 0 }, { a: 1 }, { a: 2 }, { a: -1 }]);
                expect(maxOptic.get(newState)).toEqual({ a: 2 });
            });
        });
        describe('min', () => {
            const state = [0, 1, 2, 3];
            const stateOptic = focusOn<typeof state>();
            it('should focus the minimum element', () => {
                const minOptic = stateOptic.derive(min());
                expect(minOptic.get(state)).toBe(0);

                const newState = minOptic.set(42, state);
                expect(newState).toEqual([42, 1, 2, 3]);
                expect(minOptic.get(newState)).toBe(1);
            });
            it('should focus undefined if empty', () => {
                const minOptic = stateOptic.derive(min());
                expect(minOptic.get([])).toBe(undefined);
                expect(minOptic.set(42, [])).toEqual([]);
            });
            it('should use custom number getter if provided', () => {
                const state = [{ a: 0 }, { a: 1 }, { a: 2 }, { a: 3 }];
                const stateOptic = focusOn<typeof state>();
                const minOptic = stateOptic.derive(min((x) => x.a));
                expect(minOptic.get(state)).toEqual({ a: 0 });

                const newState = minOptic.set({ a: 42 }, state);
                expect(newState).toEqual([{ a: 42 }, { a: 1 }, { a: 2 }, { a: 3 }]);
                expect(minOptic.get(newState)).toEqual({ a: 1 });
            });
        });
        describe('reverse', () => {
            const state = [0, 1, 2, 3];
            const stateOptic = focusOn<typeof state>();
            it('should reverse the array', () => {
                expect(stateOptic.derive(reverse()).get(state)).toEqual([3, 2, 1, 0]);
                expect(stateOptic.derive(reverse()).set([3, 2, 1, 0], state)).toEqual(state);
            });
        });
        describe('slice', () => {
            const state = [0, 1, 2, 3];
            const stateOptic = focusOn<typeof state>();
            it('should slice the array', () => {
                expect(stateOptic.derive(slice(1, 3)).get(state)).toEqual([1, 2]);
                expect(stateOptic.derive(slice(1, 3)).set([42, 43], state)).toEqual([0, 42, 43, 3]);
            });
            it('should slice the array from start', () => {
                expect(stateOptic.derive(slice(1)).get(state)).toEqual([1, 2, 3]);
                expect(stateOptic.derive(slice(1)).set([42, 43, 44], state)).toEqual([0, 42, 43, 44]);
            });
            it('should get the whole array if no bounds are provided', () => {
                expect(stateOptic.derive(slice()).get(state)).toEqual(state);
                expect(stateOptic.derive(slice()).set([42, 43, 44, 45], state)).toEqual([42, 43, 44, 45]);
            });
        });
        describe('sort', () => {
            const state = [31, 122, 241, 4];
            const stateOptic = focusOn<typeof state>();

            it('should sort by ascii value by default if no compare function is provided', () => {
                const sortOptic = stateOptic.derive(sort());
                expect(sortOptic.get(state)).toEqual([122, 241, 31, 4]);
            });
            it('should sort with custom compareFn', () => {
                const ascSortOptic = stateOptic.derive(sort((a, b) => a - b));
                expect(ascSortOptic.get(state)).toEqual([4, 31, 122, 241]);

                const descSortOptic = stateOptic.derive(sort((a, b) => b - a));
                expect(descSortOptic.get(state)).toEqual([241, 122, 31, 4]);
            });
        });
    });
    describe('entries', () => {
        const state: Record<string, number> = { a: 42, b: 67, c: 1000, d: 90 };
        const stateOptic = focusOn<typeof state>();
        it('should map over object entries', () => {
            const entriesOptic = stateOptic.derive(entries());
            expect(entriesOptic.get(state)).toEqual([
                ['a', 42],
                ['b', 67],
                ['c', 1000],
                ['d', 90],
            ]);
            const newState = entriesOptic.set((prev) => prev.map(([k, v]) => [k.toUpperCase(), v * 2]), state);
            expect(newState).toEqual({ A: 84, B: 134, C: 2000, D: 180 });
        });
        it('should map over object values', () => {
            const valuesOptic = stateOptic.derive(values());
            expect(valuesOptic.get(state)).toEqual([42, 67, 1000, 90]);
            const newState = valuesOptic.set((prev) => prev.map((value) => value * 2), state);
            expect(newState).toEqual({ a: 84, b: 134, c: 2000, d: 180 });
        });
    });
});
