import { focusOn } from '../focusOn';

describe('lens', () => {
    const obj = { a: { as: [1, 2, 3] } };
    const objOptic = focusOn<typeof obj>();

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
describe('partial', () => {
    type TestObj = { a: { b?: { c: number } } };
    const cOptic = focusOn<TestObj>().a.b.c;
    const testObj: TestObj = { a: { b: undefined } };
    it('should return undefined', () => {
        expect(cOptic.get(testObj)).toBeUndefined();
    });
    it('should noop when setting value', () => {
        expect(cOptic.set(42, testObj)).toBe(testObj);
    });
});
describe('derive', () => {
    it('should derive new read optic from get function', () => {
        const fooOptic = focusOn<{ foo: string }>().derive({ get: (a) => a.foo });
        expect(fooOptic.get({ foo: 'test' })).toBe('test');
    });
    it('should derive new optic from a get and a set function', () => {
        const fooOptic = focusOn<{ foo: string }>().derive({ get: (a) => a.foo, set: (b, a) => ({ ...a, foo: b }) });
        expect(fooOptic.get({ foo: 'test' })).toBe('test');
        expect(fooOptic.set('newFoo', { foo: 'test' })).toEqual({ foo: 'newFoo' });
    });
    it('should derive new partial optic from partial lens', () => {
        const evenNumberOptic = focusOn<number>().derive({
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
        const firstEvenOptic = focusOn<number[]>()
            .map()
            .reduce((values) => values.find(({ value }) => value % 2 === 0));

        expect(firstEvenOptic.get([1, 3, 2])).toBe(2);
        expect(firstEvenOptic.get([1, 3, 5])).toBe(undefined);

        expect(firstEvenOptic.set(90, [1, 3, 2])).toEqual([1, 3, 90]);
    });
    it('should derive new mapped optic from a reduce function returning multiple values', () => {
        const evenNumbersOptic = focusOn<number[]>()
            .map()
            .reduce((values) => values.filter(({ value }) => value % 2 === 0));

        expect(evenNumbersOptic.get([1, 2, 3, 4, 5, 6])).toEqual([2, 4, 6]);
        expect(evenNumbersOptic.get([1, 3, 5])).toEqual([]);

        expect(evenNumbersOptic.set((prev) => prev + 10, [1, 2, 3, 4, 5, 6])).toEqual([1, 12, 3, 14, 5, 16]);
    });
    it('should derive a new optic from another optic', () => {
        const fooOptic = focusOn<{ foo: { bar: string } }>();
        const barOptic = focusOn<{ bar: string }>();
        const fooBarOptic = fooOptic.foo.derive(barOptic);

        expect(fooBarOptic.get({ foo: { bar: 'test' } })).toEqual({ bar: 'test' });
        expect(fooBarOptic.bar.set('fooBar', { foo: { bar: 'test' } })).toEqual({ foo: { bar: 'fooBar' } });
    });
});
describe('derive isomorphism', () => {
    const objectOptic = focusOn<readonly [string, number]>().derive({
        get: ([name, age]) => ({ name, age }),
        set: (p) => [p.name, p.age] as const,
    });

    it('should derive from tuple to object', () => {
        expect(objectOptic.get(['Jean', 42])).toStrictEqual({ name: 'Jean', age: 42 });
        expect(objectOptic.set({ name: 'Albert', age: 65 }, ['Jean', 34])).toStrictEqual(['Albert', 65]);
    });
    it('should derive from celcius to fahrenheit', () => {
        const tempOptic = focusOn<number>().derive({
            get: (celcius) => celcius * (9 / 5) + 32,
            set: (fahrenheit) => (fahrenheit - 32) * (5 / 9),
        });

        expect(tempOptic.get(0)).toBe(32);
        expect(tempOptic.get(100)).toBe(212);
        expect(tempOptic.set(212, 0)).toBe(100);
    });
});
describe('focus string key', () => {
    const countryCodes: Record<string, number> = { france: 33, germany: 49, italy: 39 };
    const countryCodesOptic = focusOn<typeof countryCodes>();

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
describe('custom optic', () => {
    const evenNumsOptic = focusOn<number[]>().derive({
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
            focusOn<typeof countryInfos>().derive({
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
