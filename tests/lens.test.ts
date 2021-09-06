import { Optix, optix, optixPartial, total } from '../src/lens';

const expectType = <T>(t: T) => {};
const expectNotType = <T>(t: T) => {};

describe('lens', () => {
    const obj = { a: { as: [1, 2, 3] } };
    const onAsFirst = optix<typeof obj>().focus('a', 'as', 0);

    it('should be referentially stable', () => {
        const newObj = onAsFirst.set(1, obj);
        expect(obj).toBe(newObj);
    });
});
describe('optional', () => {
    type TestObj = { a: { b?: { c: number } } };
    const onC = optix<TestObj>().focus('a', 'b', 'c');
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
        const onFoo = optix<FooBar>().refine((a) => a.type === 'foo' && a);
        expect(onFoo.get(foo)?.foo).toBe('test');

        const updated = onFoo.set({ type: 'foo', foo: 'newFoo' }, foo);
        expect(onFoo.get(updated)?.foo).toBe('newFoo');
    });
    it('should handle the type narrowing failing', () => {
        const onBar = optix<FooBar>().refine((a) => a.type === 'bar' && a);
        expect(onBar.get(foo)).toBeUndefined();
        expect(onBar.set({ type: 'bar', bar: 99 }, foo)).toBe(foo);
    });
});
describe('convert', () => {
    const onTuple = optix<[string, number]>().convert(
        ([name, age]) => ({ name, age }),
        ({ name, age }) => [name, age],
    );

    it('should convert from tuple to object', () => {
        expect(onTuple.get(['Jean', 42])).toStrictEqual({ name: 'Jean', age: 42 });
        expect(onTuple.set({ name: 'Albert', age: 65 }, ['Jean', 34])).toStrictEqual(['Albert', 65]);
    });
    it('should convert from celcius to fahrenheit', () => {
        const onTemp = optix<number>().convert(
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
describe('filter', () => {
    const onEvenNumber = optix<number>().filter((n) => n % 2 === 0);

    const onMajorName = optix<{ age: number; name: string }>()
        .filter(({ age }) => age >= 18)
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
describe('findFirst', () => {
    const arr = [42, 78, 23];
    const onArr = optix<number[]>();

    it('should find the element and focus on it', () => {
        const onOdd = onArr.findFirst((x) => x % 2 !== 0);
        expect(onOdd.get(arr)).toBe(23);

        const newArr = onOdd.set(2, arr);
        expect(newArr).toStrictEqual([42, 78, 2]);
        expect(onOdd.get(newArr)).toBeUndefined();
    });
    it('should find no element and return undefined', () => {
        const onOver100 = onArr.findFirst((x) => x > 100);
        expect(onOver100.get(arr)).toBeUndefined();
        expect(onOver100.set(1000, arr)).toBe(arr);
    });
});
describe('key', () => {
    const countryCodes: Record<string, number> = { france: 33, germany: 49, italy: 39 };
    const onCountryCodes = optix<typeof countryCodes>();

    it('should focus on the value indexed by the key', () => {
        const onFrance = onCountryCodes.key('france');
        expect(onFrance.get(countryCodes)).toBe(33);
        expect(onFrance.set(-1, countryCodes)).toStrictEqual({ france: -1, germany: 49, italy: 39 });
    });
    it('should find no key and return undefined', () => {
        const onSpain = onCountryCodes.key('spain');
        expect(onSpain.get(countryCodes)).toBeUndefined();
        expect(onSpain.set(-1, countryCodes)).toBe(countryCodes);
    });
});
describe('focusWithDefault', () => {
    type Test = { a?: { b?: number } };
    const onB = optix<Test>()
        .focus('a')
        .focusWithDefault('b', () => 42);

    it('should use fallback', () => {
        const test: Test = { a: { b: undefined } };
        expect(onB.get(test)).toBe(42);
        expect(onB.set(90, test)).toStrictEqual({ a: { b: 90 } });
    });
    it('should be referentially stable', () => {
        const onA = optix<Test>().focusWithDefault('a', () => ({ b: 42 }));
        const emptyA: Test = { a: undefined };
        expect(onA.get(emptyA)).toBe(onA.get(emptyA));
    });
});
describe('custom optix', () => {
    const onEvenNums = optix({ get: (s: number[]) => s.filter((n) => n % 2 === 0), set: (a) => a, key: 'onEven' });
    const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    it('should work', () => {
        expect(onEvenNums.get(nums)).toStrictEqual([0, 2, 4, 6, 8]);
        expect(onEvenNums.set([42, 84], nums)).toStrictEqual([42, 84]);
    });
    it('should be referentially stable', () => {
        expect(onEvenNums.get(nums)).toBe(onEvenNums.get(nums));
    });
});
describe('custom partial optix', () => {
    const countryInfos: Record<string, { capital: string }> = {
        france: { capital: 'Paris' },
        germany: { capital: 'Berlin' },
    };
    it('should work', () => {
        const onCountry = (country: string) =>
            optixPartial({
                get: (s: typeof countryInfos) => s[country],
                set: (a, s) => (s[country] !== undefined ? { ...s, [country]: a } : s),
                key: 'onCountry ' + country,
            });
        const onFrance = onCountry('france');
        const onSpain = onCountry('spain');

        expect(onFrance.get(countryInfos)?.capital).toBe('Paris');
        expect(onSpain.get(countryInfos)?.capital).toBeUndefined();
        expect(onFrance.set({ capital: 'Marseille' }, countryInfos)['france']).toStrictEqual({ capital: 'Marseille' });
        expect(onSpain.set({ capital: 'Barcelona' }, countryInfos)).toBe(countryInfos);
    });
    it('should be referentially stable', () => {
        const onEntriesNoEmpty = optixPartial({
            get: (s: typeof countryInfos) => {
                const values = Object.values(s);
                return values.length > 0 ? values : undefined;
            },
            set: (a, s) => {
                const values = Object.values(s);
                return values.length > 0 ? Object.fromEntries(Object.keys(s).map((k, i) => [k, a[i]])) : s;
            },
            key: 'onEntriesNoEmpty',
        });

        expect(onEntriesNoEmpty.get(countryInfos)).toBe(onEntriesNoEmpty.get(countryInfos));
    });
});
describe('focusMany', () => {
    const onObj = optix<{ a: string[]; b: boolean }>();
    it('should return optix with capitalized names', () => {
        expect(onObj.focusMany(['a', 'b'])).toStrictEqual({
            onA: expect.any(Optix),
            onB: expect.any(Optix),
        });
        expect(optix<number[]>().focusMany([0, 1])).toStrictEqual({ on0: expect.any(Optix), on1: expect.any(Optix) });
    });
    it('should allow custom prefix', () => {
        expect(onObj.focusMany(['a', 'b'], 'test')).toStrictEqual({
            testA: expect.any(Optix),
            testB: expect.any(Optix),
        });
    });
    it('should allow no prefix', () => {
        expect(onObj.focusMany(['a', 'b'], '')).toStrictEqual({
            a: expect.any(Optix),
            b: expect.any(Optix),
        });
        expect(optix<number[]>().focusMany([0, 1], '')).toStrictEqual({ 0: expect.any(Optix), 1: expect.any(Optix) });
    });
    it('should yield partial optix when parent optix focus on nullable', () => {
        const { onB, onC } = optix<{ a?: { b: boolean; c: number } }>().focus('a').focusMany(['b', 'c']);
        // @ts-expect-error
        expectNotType<Optix<any, total>>(onB);
        // @ts-expect-error
        expectNotType<Optix<any, total>>(onC);
    });
});
