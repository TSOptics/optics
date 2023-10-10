import { mapped, partial, total } from './types';
import { pureOptic } from './pureOpticConstructor';
import { PureOptic } from './PureOptic';
import { find } from './combinators/find';
import { refine } from './combinators/refine';
import { cond } from './combinators/cond';
import { at } from './combinators/at';
import { indexBy } from './combinators/indexBy';
import { min } from './combinators/min';
import { max } from './combinators/max';
import { reverse } from './combinators/reverse';
import { slice } from './combinators/slice';
import { values } from './combinators/values';
import { entries } from './combinators/entries';
import { toPartial } from './combinators/toPartial';
import { sort } from './combinators/sort';

const expectType = <T extends any>(t: T) => {};
const expectPartial = <TScope extends partial>(
    optic: PureOptic<any, TScope>,
    t: TScope extends total ? never : true,
) => {};

const expectTotal = (optic: PureOptic<any, total>) => {};
const expectMapped = (optic: PureOptic<any, mapped>) => {};

describe('lens', () => {
    const obj = { a: { as: [1, 2, 3] } };
    const objOptic = pureOptic<typeof obj>();

    it('should derive from integer when focused on array', () => {
        const secondElementOptic = objOptic.a.as[1];

        expect(secondElementOptic.get(obj)).toBe(2);
        expect(secondElementOptic.set(42, obj)).toEqual({ a: { as: [1, 42, 3] } });
    });
    it('should be referentially stable', () => {
        const asFirstOptic = objOptic.a.as[0];

        expect(asFirstOptic.set(1, obj)).toBe(obj);
        expect(asFirstOptic.set((prev) => prev, obj)).toBe(obj);
    });
});
describe('optional', () => {
    type TestObj = { a: { b?: { c: number } } };
    const onC = pureOptic<TestObj>().a.b.c;
    const testObj: TestObj = { a: { b: undefined } };
    it('should return undefined', () => {
        expect(onC.get(testObj)).toBeUndefined();
    });
    it('should noop when setting value', () => {
        expect(onC.set(42, testObj)).toBe(testObj);
    });
});
describe('refine', () => {
    type FooBar = { type: 'foo'; foo: string } | { type: 'bar'; bar: number };
    const foo: FooBar = { type: 'foo', foo: 'test' };
    it('should focus on a part of the union', () => {
        const fooOptic = pureOptic<FooBar>().derive(refine((a) => a.type === 'foo' && a));
        expect(fooOptic.get(foo)?.foo).toBe('test');

        const updated = fooOptic.set({ type: 'foo', foo: 'newFoo' }, foo);
        expect(fooOptic.get(updated)?.foo).toBe('newFoo');
    });
    it('should handle the type narrowing failing', () => {
        const barOptic = pureOptic<FooBar>().derive(refine((a) => a.type === 'bar' && a));
        expect(barOptic.get(foo)).toBeUndefined();
        expect(barOptic.set({ type: 'bar', bar: 99 }, foo)).toBe(foo);
    });
});
describe('derive', () => {
    it('should derive new read optic from get function', () => {
        const fooOptic = pureOptic<{ foo: string }>().derive({ get: (a) => a.foo });
        expect(fooOptic.get({ foo: 'test' })).toBe('test');
    });
    it('should derive new optic from a get and a set function', () => {
        const fooOptic = pureOptic<{ foo: string }>().derive({ get: (a) => a.foo, set: (b, a) => ({ ...a, foo: b }) });
        expect(fooOptic.get({ foo: 'test' })).toBe('test');
        expect(fooOptic.set('newFoo', { foo: 'test' })).toEqual({ foo: 'newFoo' });
    });
    it('should derive new partial optic from partial lens', () => {
        const evenNumberOptic = pureOptic<number>().derive({
            type: 'partial',
            get: (a) => (a % 2 === 0 ? a : undefined),
            set: (a, s) => (a % 2 === 0 ? a : s),
        });
        expect(evenNumberOptic.get(2)).toBe(2);
        expect(evenNumberOptic.get(3)).toBeUndefined();

        expect(evenNumberOptic.set(4, 3)).toBe(4);
        expect(evenNumberOptic.set(5, 2)).toBe(2);
    });
    it('should derive new partial optic from fold lens and mapped optic', () => {
        const firstEvenOptic = pureOptic<number[]>()
            .map()
            .reduce((values) => values.find(({ value }) => value % 2 === 0));

        expect(firstEvenOptic.get([1, 3, 2])).toBe(2);
        expect(firstEvenOptic.get([1, 3, 5])).toBe(undefined);

        expect(firstEvenOptic.set(90, [1, 3, 2])).toEqual([1, 3, 90]);
    });
    it('should derive new mapped optic from a reduce function returning multiple values', () => {
        const evenNumbersOptic = pureOptic<number[]>()
            .map()
            .reduce((values) => values.filter(({ value }) => value % 2 === 0));

        expect(evenNumbersOptic.get([1, 2, 3, 4, 5, 6])).toEqual([2, 4, 6]);
        expect(evenNumbersOptic.get([1, 3, 5])).toEqual([]);

        expect(evenNumbersOptic.set((prev) => prev + 10, [1, 2, 3, 4, 5, 6])).toEqual([1, 12, 3, 14, 5, 16]);
    });
    it('should derive a new optic from another optic', () => {
        const fooOptic = pureOptic<{ foo: { bar: string } }>();
        const barOptic = pureOptic<{ bar: string }>();
        const fooBarOptic = fooOptic.foo.derive(barOptic);

        expect(fooBarOptic.get({ foo: { bar: 'test' } })).toEqual({ bar: 'test' });
        expect(fooBarOptic.bar.set('fooBar', { foo: { bar: 'test' } })).toEqual({ foo: { bar: 'fooBar' } });
    });
});
describe('derive isomorphism', () => {
    const objectOptic = pureOptic<readonly [string, number]>().derive({
        get: ([name, age]) => ({ name, age }),
        set: (p) => [p.name, p.age] as const,
    });

    it('should derive from tuple to object', () => {
        expect(objectOptic.get(['Jean', 42])).toStrictEqual({ name: 'Jean', age: 42 });
        expect(objectOptic.set({ name: 'Albert', age: 65 }, ['Jean', 34])).toStrictEqual(['Albert', 65]);
    });
    it('should derive from celcius to fahrenheit', () => {
        const tempOptic = pureOptic<number>().derive({
            get: (celcius) => celcius * (9 / 5) + 32,
            set: (fahrenheit) => (fahrenheit - 32) * (5 / 9),
        });

        expect(tempOptic.get(0)).toBe(32);
        expect(tempOptic.get(100)).toBe(212);
        expect(tempOptic.set(212, 0)).toBe(100);
    });
});
describe('if', () => {
    const evenNumberOptic = pureOptic<number>().derive(cond((n) => n % 2 === 0));

    const majorNameOptic = pureOptic<{ age: number; name: string }>().derive(cond(({ age }) => age >= 18)).name;
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
describe('focus string key', () => {
    const countryCodes: Record<string, number> = { france: 33, germany: 49, italy: 39 };
    const countryCodesOptic = pureOptic<typeof countryCodes>();

    it('should focus on the value indexed by the key', () => {
        const franceOptic = countryCodesOptic['france'];
        expect(franceOptic.get(countryCodes)).toBe(33);
        expect(franceOptic.set(-1, countryCodes)).toStrictEqual({ france: -1, germany: 49, italy: 39 });
    });
    it('should find no key and return undefined', () => {
        const spainOptic = countryCodesOptic['spain'];
        expect(spainOptic.get(countryCodes)).toBeUndefined();
    });
    it("should allow to set a key if it doesn't exist yet", () => {
        const spainOptic = countryCodesOptic['spain'];
        expect(spainOptic.set(34, countryCodes)).toEqual({ france: 33, germany: 49, italy: 39, spain: 34 });
    });
});
describe('toPartial', () => {
    it('should turn a total optic focused on a nullable type to a partial optic focused on the same type but non nullable', () => {
        const onA = pureOptic<{ a?: number }>().a.derive(toPartial());
        expectPartial(onA, true);
        expect(onA.get({ a: undefined })).toBe(undefined);
        expect(onA.set((prev) => prev + 10, { a: undefined })).toEqual({ a: undefined });
        expect(onA.set((prev) => prev + 10, { a: 42 })).toEqual({ a: 52 });

        const onB = pureOptic<{ a?: { b?: number } }>().a.b.derive(toPartial());
        expectPartial(onB, true);
        expect(onB.get({ a: { b: undefined } })).toBe(undefined);
        expect(onB.set((prev) => prev + 10, { a: { b: undefined } })).toEqual({ a: { b: undefined } });
        expect(onB.set((prev) => prev + 10, { a: { b: 42 } })).toEqual({ a: { b: 52 } });

        const asOptic = pureOptic<{ a?: number }[]>().map().a.derive(toPartial());
        expectMapped(asOptic);
        expect(asOptic.get([{ a: undefined }, { a: 42 }])).toEqual([42]);
        expect(asOptic.set((prev) => prev + 10, [{ a: undefined }, { a: 42 }])).toEqual([{ a: undefined }, { a: 52 }]);
    });
});
describe('array methods', () => {
    describe('at', () => {
        const state = [0, 1, 2, 3];
        const stateOptic = pureOptic<typeof state>();
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
        const stateOptic = pureOptic<typeof state>();
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
        const stateOptic = pureOptic<typeof state>();
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
        const stateOptic = pureOptic<typeof state>();
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
            const stateOptic = pureOptic<typeof state>();
            const maxOptic = stateOptic.derive(max((x) => x.a));
            expect(maxOptic.get(state)).toEqual({ a: 3 });

            const newState = maxOptic.set({ a: -1 }, state);
            expect(newState).toEqual([{ a: 0 }, { a: 1 }, { a: 2 }, { a: -1 }]);
            expect(maxOptic.get(newState)).toEqual({ a: 2 });
        });
    });
    describe('min', () => {
        const state = [0, 1, 2, 3];
        const stateOptic = pureOptic<typeof state>();
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
            const stateOptic = pureOptic<typeof state>();
            const minOptic = stateOptic.derive(min((x) => x.a));
            expect(minOptic.get(state)).toEqual({ a: 0 });

            const newState = minOptic.set({ a: 42 }, state);
            expect(newState).toEqual([{ a: 42 }, { a: 1 }, { a: 2 }, { a: 3 }]);
            expect(minOptic.get(newState)).toEqual({ a: 1 });
        });
    });
    describe('reverse', () => {
        const state = [0, 1, 2, 3];
        const stateOptic = pureOptic<typeof state>();
        it('should reverse the array', () => {
            expect(stateOptic.derive(reverse()).get(state)).toEqual([3, 2, 1, 0]);
            expect(stateOptic.derive(reverse()).set([3, 2, 1, 0], state)).toEqual(state);
        });
    });
    describe('slice', () => {
        const state = [0, 1, 2, 3];
        const stateOptic = pureOptic<typeof state>();
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
        const stateOptic = pureOptic<typeof state>();

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
    const stateOptic = pureOptic<typeof state>();
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
describe('custom optic', () => {
    const evenNumsOptic = pureOptic<number[]>().derive({
        get: (s: number[]) => s.filter((n) => n % 2 === 0),
        set: (a) => a,
        key: 'evenNums',
    });
    const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    it('should work', () => {
        expect(evenNumsOptic.get(nums)).toStrictEqual([0, 2, 4, 6, 8]);
        expect(evenNumsOptic.set([42, 84], nums)).toStrictEqual([42, 84]);
    });

    const countryInfos: Record<string, { capital: string }> = {
        france: { capital: 'Paris' },
        germany: { capital: 'Berlin' },
    };
    it('should work', () => {
        const countryOptic = (country: string) =>
            pureOptic<typeof countryInfos>().derive({
                get: (s) => s[country],
                set: (a, s) => (s[country] !== undefined ? { ...s, [country]: a } : s),
                key: 'optic on ' + country,
            });
        const franceOptic = countryOptic('france');
        const spainOptic = countryOptic('spain');

        expect(franceOptic.get(countryInfos)?.capital).toBe('Paris');
        expect(spainOptic.get(countryInfos)?.capital).toBeUndefined();
        expect(franceOptic.set({ capital: 'Marseille' }, countryInfos)['france']).toStrictEqual({
            capital: 'Marseille',
        });
        expect(spainOptic.set({ capital: 'Barcelona' }, countryInfos)).toBe(countryInfos);
    });
});
