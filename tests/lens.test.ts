import { optix } from '../src/combinators';

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

    it('should focus on the value paired to the key', () => {
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
