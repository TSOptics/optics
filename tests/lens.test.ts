import { optic, opticPartial } from '../src/constructors';
import { Optic } from '../src/Optic';
import { total } from '../src/types';
import { noop } from '../src/utils';

const expectType = <T>(t: T) => noop();
const expectNotType = <T>(t: T) => noop();

describe('lens', () => {
    const obj = { a: { as: [1, 2, 3] } };
    const onAsFirst = optic<typeof obj>().focus('a.as').focus(0);

    it('should be referentially stable', () => {
        expect(onAsFirst.set(1, obj)).toBe(obj);
        expect(onAsFirst.set((prev) => prev, obj)).toBe(obj);
    });
});
describe('optional', () => {
    type TestObj = { a: { b?: { c: number } } };
    const onC = optic<TestObj>().focus('a.b?.c');
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
        const onFoo = optic<FooBar>().refine((a) => a.type === 'foo' && a);
        expect(onFoo.get(foo)?.foo).toBe('test');

        const updated = onFoo.set({ type: 'foo', foo: 'newFoo' }, foo);
        expect(onFoo.get(updated)?.foo).toBe('newFoo');
    });
    it('should handle the type narrowing failing', () => {
        const onBar = optic<FooBar>().refine((a) => a.type === 'bar' && a);
        expect(onBar.get(foo)).toBeUndefined();
        expect(onBar.set({ type: 'bar', bar: 99 }, foo)).toBe(foo);
    });
});
describe('convert', () => {
    const onTuple = optic<[string, number]>().convert(
        ([name, age]) => ({ name, age }),
        ({ name, age }) => [name, age],
    );

    it('should convert from tuple to object', () => {
        expect(onTuple.get(['Jean', 42])).toStrictEqual({ name: 'Jean', age: 42 });
        expect(onTuple.set({ name: 'Albert', age: 65 }, ['Jean', 34])).toStrictEqual(['Albert', 65]);
    });
    it('should convert from celcius to fahrenheit', () => {
        const onTemp = optic<number>().convert(
            (celcius) => celcius * (9 / 5) + 32,
            (fahrenheit) => (fahrenheit - 32) * (5 / 9),
        );

        expect(onTemp.get(0)).toBe(32);
        expect(onTemp.get(100)).toBe(212);
        expect(onTemp.set(212, 0)).toBe(100);
    });
    it('should be referentially stable', () => {
        const tuple: [string, number] = ['Jean', 42];
        expect(onTuple.get(tuple)).toBe(onTuple.get(tuple));
        expect(onTuple.set(onTuple.get(tuple), tuple)).toBe(tuple);
    });
});
describe('if', () => {
    const onEvenNumber = optic<number>().if((n) => n % 2 === 0);

    const onMajorName = optic<{ age: number; name: string }>()
        .if(({ age }) => age >= 18)
        .focus('name');
    const major = { age: 42, name: 'Louis' };
    const minor = { age: 15, name: 'Killian' };
    it('should get result with predicate true', () => {
        expect(onEvenNumber.get(2)).toBe(2);
        expect(onEvenNumber.set(4, 2)).toBe(4);

        expect(onMajorName.get(major)).toBe('Louis');
        expect(onMajorName.set('François', major)).toStrictEqual({ name: 'François', age: 42 });
    });
    it('should return undefined with predicate false', () => {
        expect(onEvenNumber.get(3)).toBeUndefined();
        expect(onEvenNumber.set(2, 3)).toBe(3);

        expect(onMajorName.get(minor)).toBeUndefined();
        expect(onMajorName.set('Titouan', minor)).toBe(minor);
    });
});
describe('atKey', () => {
    const countryCodes: Record<string, number> = { france: 33, germany: 49, italy: 39 };
    const onCountryCodes = optic<typeof countryCodes>();

    it('should focus on the value indexed by the key', () => {
        const onFrance = onCountryCodes.atKey('france');
        expect(onFrance.get(countryCodes)).toBe(33);
        expect(onFrance.set(-1, countryCodes)).toStrictEqual({ france: -1, germany: 49, italy: 39 });
    });
    it('should find no key and return undefined', () => {
        const onSpain = onCountryCodes.atKey('spain');
        expect(onSpain.get(countryCodes)).toBeUndefined();
        expect(onSpain.set(-1, countryCodes)).toBe(countryCodes);
    });
});
describe('focusWithDefault', () => {
    type Test = { a?: { b?: number } };
    const onB = optic<Test>()
        .focus('a')
        .focusWithDefault('b', () => 42);

    it('should use fallback', () => {
        const test: Test = { a: { b: undefined } };
        expect(onB.get(test)).toBe(42);
        expect(onB.set(90, test)).toStrictEqual({ a: { b: 90 } });
    });
    it('should be referentially stable', () => {
        const onA = optic<Test>().focusWithDefault('a', () => ({ b: 42 }));
        const emptyA: Test = { a: undefined };
        expect(onA.get(emptyA)).toBe(onA.get(emptyA));
    });
});
describe('custom optic', () => {
    const onEvenNums = optic(
        (s: number[]) => s.filter((n) => n % 2 === 0),
        (a) => a,
        'onEven',
    );
    const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    it('should work', () => {
        expect(onEvenNums.get(nums)).toStrictEqual([0, 2, 4, 6, 8]);
        expect(onEvenNums.set([42, 84], nums)).toStrictEqual([42, 84]);
    });
    it('should be referentially stable', () => {
        expect(onEvenNums.get(nums)).toBe(onEvenNums.get(nums));
    });
});
describe('custom partial optic', () => {
    const countryInfos: Record<string, { capital: string }> = {
        france: { capital: 'Paris' },
        germany: { capital: 'Berlin' },
    };
    it('should work', () => {
        const onCountry = (country: string) =>
            opticPartial(
                (s: typeof countryInfos) => s[country],
                (a, s) => (s[country] !== undefined ? { ...s, [country]: a } : s),
                'onCountry ' + country,
            );
        const onFrance = onCountry('france');
        const onSpain = onCountry('spain');

        expect(onFrance.get(countryInfos)?.capital).toBe('Paris');
        expect(onSpain.get(countryInfos)?.capital).toBeUndefined();
        expect(onFrance.set({ capital: 'Marseille' }, countryInfos)['france']).toStrictEqual({ capital: 'Marseille' });
        expect(onSpain.set({ capital: 'Barcelona' }, countryInfos)).toBe(countryInfos);
    });
    it('should be referentially stable', () => {
        const onEntriesNoEmpty = opticPartial(
            (s: typeof countryInfos) => {
                const values = Object.values(s);
                return values.length > 0 ? values : undefined;
            },
            (a, s) => {
                const values = Object.values(s);
                return values.length > 0 ? Object.fromEntries(Object.keys(s).map((k, i) => [k, a[i]])) : s;
            },
            'onEntriesNoEmpty',
        );

        expect(onEntriesNoEmpty.get(countryInfos)).toBe(onEntriesNoEmpty.get(countryInfos));
    });
});
describe('focusMany', () => {
    const onObj = optic<{ a: string[]; b: boolean }>();
    it('should return optics with capitalized names', () => {
        expect(onObj.focusMany(['a', 'b'])).toStrictEqual({
            onA: expect.any(Optic),
            onB: expect.any(Optic),
        });
        expect(optic<number[]>().focusMany([0, 1])).toStrictEqual({ on0: expect.any(Optic), on1: expect.any(Optic) });
    });
    it('should allow custom prefix', () => {
        expect(onObj.focusMany(['a', 'b'], 'test')).toStrictEqual({
            testA: expect.any(Optic),
            testB: expect.any(Optic),
        });
    });
    it('should allow no prefix', () => {
        expect(onObj.focusMany(['a', 'b'], '')).toStrictEqual({
            a: expect.any(Optic),
            b: expect.any(Optic),
        });
        expect(optic<number[]>().focusMany([0, 1], '')).toStrictEqual({ 0: expect.any(Optic), 1: expect.any(Optic) });
    });
    it('should yield partial optics when parent optic focus on nullable', () => {
        const { onB, onC } = optic<{ a?: { b: boolean; c: number } }>().focus('a').focusMany(['b', 'c']);
        // @ts-expect-error
        expectNotType<Optic<any, total>>(onB);
        // @ts-expect-error
        expectNotType<Optic<any, total>>(onC);
    });
});
