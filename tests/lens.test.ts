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
        const onFoo = optix<FooBar>()
            .refine((a) => a.type === 'foo' && a)
            .focus('foo');
        expect(onFoo.get(foo)).toBe('test');

        const updated = onFoo.set('newFoo', foo);
        expect(onFoo.get(updated)).toBe('newFoo');
    });
    it('should handle the type narrowing failing', () => {
        const onBar = optix<FooBar>()
            .refine((a) => a.type === 'bar' && a)
            .focus('bar');
        expect(onBar.get(foo)).toBeUndefined();

        const updated = onBar.set(42, foo);
        expect(updated).toBe(foo);
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
