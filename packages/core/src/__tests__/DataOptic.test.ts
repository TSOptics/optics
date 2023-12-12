import { focusOn } from '../DataOptic/focusOn';
import { pureOptic } from '../pureOpticConstructor';

describe('DataOptic', () => {
    it('should chain set', () => {
        const newValue = focusOn({ a: { b: 1 }, aa: true })
            .a.b.set((prev) => prev + 1)
            .aa.set((prev) => !prev)
            .get();

        expect(newValue).toEqual({ a: { b: 2 }, aa: false });
    });

    describe('partial', () => {
        type TestObj = { a: { b?: { c: number } } };
        const testObj: TestObj = { a: {} };
        const cOptic = focusOn<TestObj>(testObj).a.b.c;

        it('should return undefined', () => {
            expect(cOptic.get()).toBeUndefined();
        });

        it('should noop when setting value', () => {
            expect(cOptic.set(42).get()).toBe(testObj);
        });
    });
    describe('derive', () => {
        it('should derive new optic from a get and a set function', () => {
            const fooOptic = focusOn({ foo: 'test' }).derive({ get: (a) => a.foo, set: (b, a) => ({ ...a, foo: b }) });
            expect(fooOptic.get()).toBe('test');
            expect(fooOptic.set('newFoo').get()).toEqual({ foo: 'newFoo' });
        });
        it('should derive new partial optic from partial lens', () => {
            const evenNumberOptic = focusOn(2).derive({
                type: 'partial',
                get: (a) => (a % 2 === 0 ? a : undefined),
                set: (a, s) => (a % 2 === 0 ? a : s),
            });
            expect(evenNumberOptic.get()).toBe(2);
            expect(evenNumberOptic.set(3).get()).toBe(2);

            expect(evenNumberOptic.set(4).get()).toBe(4);
        });
        it('should derive new partial optic from fold lens and mapped optic', () => {
            const firstEvenOptic = focusOn([1, 3, 2])
                .map()
                .reduce((values) => values.find(({ value }) => value % 2 === 0));

            expect(firstEvenOptic.get()).toBe(2);
            expect(firstEvenOptic.set(5).get()).toEqual([1, 3, 5]);

            expect(firstEvenOptic.set(90).get()).toEqual([1, 3, 90]);
        });
        it('should derive new mapped optic from a reduce function returning multiple values', () => {
            const evenNumbersOptic = focusOn([1, 2, 3, 4, 5, 6])
                .map()
                .reduce((values) => values.filter(({ value }) => value % 2 === 0));

            expect(evenNumbersOptic.set((prev) => prev + 10).get()).toEqual([1, 12, 3, 14, 5, 16]);
        });
        it('should derive a new optic from another optic', () => {
            const fooOptic = focusOn({ foo: { bar: 'test' } });
            const barOptic = pureOptic<{ bar: string }>().bar;
            const fooBarOptic = fooOptic.foo.derive(barOptic);

            expect(fooBarOptic.get()).toEqual('test');
            expect(fooBarOptic.set('fooBar').get()).toEqual({ foo: { bar: 'fooBar' } });
        });
    });
    describe('derive isomorphism', () => {
        const objectOptic = focusOn<readonly [string, number]>(['Jean', 42]).derive({
            get: ([name, age]) => ({ name, age }),
            set: (p) => [p.name, p.age] as const,
        });

        it('should derive from tuple to object', () => {
            expect(objectOptic.get()).toStrictEqual({ name: 'Jean', age: 42 });
            expect(objectOptic.set({ name: 'Albert', age: 65 }).get()).toStrictEqual(['Albert', 65]);
        });
        it('should derive from celcius to fahrenheit', () => {
            const tempOptic = focusOn(0).derive({
                get: (celcius) => celcius * (9 / 5) + 32,
                set: (fahrenheit) => (fahrenheit - 32) * (5 / 9),
            });

            expect(tempOptic.get()).toBe(32);
            expect(tempOptic.set(212).get()).toBe(100);
        });
    });
    describe('focus string key', () => {
        const countryCodes: Record<string, number> = { france: 33, germany: 49, italy: 39 };
        const countryCodesOptic = focusOn(countryCodes);

        it('should focus on the value indexed by the key', () => {
            const franceOptic = countryCodesOptic['france'];
            expect(franceOptic.get()).toBe(33);
            expect(franceOptic.set(-1).get()).toStrictEqual({ france: -1, germany: 49, italy: 39 });
        });
        it('should find no key and return undefined', () => {
            const spainOptic = countryCodesOptic['spain'];
            expect(spainOptic.get()).toBeUndefined();
        });
        it("should allow to set a key if it doesn't exist yet", () => {
            const spainOptic = countryCodesOptic['spain'];
            expect(spainOptic.set(34).get()).toEqual({ france: 33, germany: 49, italy: 39, spain: 34 });
        });
    });
});
