import { noop } from '@babel/types';
import { optic, opticPartial } from './constructors';
import { BaseOptic } from './BaseOptic';
import { mapped, partial, total } from './types';
import { Optic } from './Optic';
import { createStore } from './Store';

const expectType = <T extends any>(t: T) => noop();
const expectPartial = <TOpticType extends partial>(
    optic: BaseOptic<any, TOpticType>,
    t: TOpticType extends total ? never : true,
) => noop();

const expectTotal = (optic: BaseOptic<any, total>) => noop();
const expectMapped = (optic: BaseOptic<any, mapped>) => noop();

describe('Optic', () => {
    it('should be a subtype of Optic', () => {
        const storeOptic = {} as Optic<number>;
        const baseOptic: BaseOptic<number> = storeOptic;
    });
    it('should be covariant on type param TOpticType', () => {
        const storeOptic = {} as Optic<number>;
        const basePartialOptic: BaseOptic<number, partial> = storeOptic;
        const storePartialOptic: Optic<number, partial> = storeOptic;
    });
    it('should compose with plain optics', () => {
        const onState = createStore({ a: { b: 42 } });
        const onNumber = optic<{ b: number }>().focus('b');
        const onNumberFromState = onState.focus('a').compose(onNumber);
        expectType<Optic<number, total, { a: { b: number } }>>(onNumberFromState);
        expect(onNumberFromState.getState()).toBe(42);
    });
    describe('direct store access', () => {
        const onState = createStore({ a: 42 });
        expect(onState.getState()).toEqual({ a: 42 });

        onState.setState({ a: 100 });
        expect(onState.getState()).toEqual({ a: 100 });

        const onNumber = onState.focus('a');
        const listener = jest.fn();
        onNumber.subscribe(listener);
        onState.setState({ a: 42 });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(42);
    });
});
describe('lens', () => {
    const obj = { a: { as: [1, 2, 3] } };
    const onAsFirst = optic<typeof obj>().focus('a.as').focus(0);

    it('should be referentially stable', () => {
        expect(onAsFirst.set(1, obj)).toBe(obj);
        expect(onAsFirst.set((prev) => prev, obj)).toBe(obj);
    });
});
describe('focus on top types', () => {
    it('should allow arbitrary paths when focused on type any', () => {
        optic<any>().focus('arbitrary.path');
    });
    it("should't accept a path when focused on type unknown", () => {
        optic<unknown>().focus('' as never);
    });
    it('should stop searching deeper when encountering any or unknown', () => {
        const validPath: 'a' | 'a.b' | 'a.c' = 'a.b';
        optic<{ a: { b: any; c: unknown } }>().focus(validPath);
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
    const onObject = optic<[string, number]>().convert(
        ([name, age]) => ({ name, age }),
        ({ name, age }) => [name, age],
    );

    it('should convert from tuple to object', () => {
        expect(onObject.get(['Jean', 42])).toStrictEqual({ name: 'Jean', age: 42 });
        expect(onObject.set({ name: 'Albert', age: 65 }, ['Jean', 34])).toStrictEqual(['Albert', 65]);
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
        const onObjectStore = createStore(tuple).compose(onObject);
        const object = onObjectStore.getState();
        expect(object).toBe(onObjectStore.getState());

        onObjectStore.setState((x) => x);
        expect(object).toBe(onObjectStore.getState());
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
describe('focus string key', () => {
    const countryCodes: Record<string, number> = { france: 33, germany: 49, italy: 39 };
    const onCountryCodes = optic<typeof countryCodes>();

    it('should focus on the value indexed by the key', () => {
        const onFrance = onCountryCodes.focus('france');
        expect(onFrance.get(countryCodes)).toBe(33);
        expect(onFrance.set(-1, countryCodes)).toStrictEqual({ france: -1, germany: 49, italy: 39 });
    });
    it('should find no key and return undefined', () => {
        const onSpain = onCountryCodes.focus('spain');
        expect(onSpain.get(countryCodes)).toBeUndefined();
        expect(onSpain.toPartial().set(-1, countryCodes)).toBe(countryCodes);
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
        expect(onB.set(90, test)).toEqual({ a: { b: 90 } });
    });
    it('should be referentially stable', () => {
        const emptyA: Test = { a: undefined };
        const onAStore = createStore(emptyA).focusWithDefault('a', () => ({ b: 42 }));
        expect(onAStore.getState()).toBe(onAStore.getState());
    });
});
describe('toPartial', () => {
    const onA = optic<{ a?: number }>().focus('a').toPartial();
    expectPartial(onA, true);
    expect(onA.get({ a: undefined })).toBe(undefined);
    expect(onA.set((prev) => prev + 10, { a: undefined })).toEqual({ a: undefined });
    expect(onA.set((prev) => prev + 10, { a: 42 })).toEqual({ a: 52 });

    const onB = optic<{ a?: { b?: number } }>().focus('a?.b').toPartial();
    expectPartial(onB, true);
    expect(onB.get({ a: { b: undefined } })).toBe(undefined);
    expect(onB.set((prev) => prev + 10, { a: { b: undefined } })).toEqual({ a: { b: undefined } });
    expect(onB.set((prev) => prev + 10, { a: { b: 42 } })).toEqual({ a: { b: 52 } });

    const onAs = optic<{ a?: number }[]>().map().focus('a').toPartial();
    expectMapped(onAs);
    expect(onAs.get([{ a: undefined }, { a: 42 }])).toEqual([42]);
    expect(onAs.set((prev) => prev + 10, [{ a: undefined }, { a: 42 }])).toEqual([{ a: undefined }, { a: 52 }]);
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
        const onEvenNumsStore = createStore(nums).compose(onEvenNums);
        expect(onEvenNumsStore.getState()).toBe(onEvenNumsStore.getState());
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
});
describe('focusMany', () => {
    const onObj = optic<{ a: string[]; b: boolean }>();
    it('should return optics with capitalized names', () => {
        expect(onObj.focusMany(['a', 'b'])).toStrictEqual({
            onA: expect.any(BaseOptic),
            onB: expect.any(BaseOptic),
        });
        expect(optic<number[]>().focusMany([0, 1])).toStrictEqual({
            on0: expect.any(BaseOptic),
            on1: expect.any(BaseOptic),
        });
    });
    it('should allow custom prefix', () => {
        expect(onObj.focusMany(['a', 'b'], 'test')).toStrictEqual({
            testA: expect.any(BaseOptic),
            testB: expect.any(BaseOptic),
        });
    });
    it('should allow no prefix', () => {
        expect(onObj.focusMany(['a', 'b'], '')).toStrictEqual({
            a: expect.any(BaseOptic),
            b: expect.any(BaseOptic),
        });
        expect(optic<number[]>().focusMany([0, 1], '')).toStrictEqual({
            0: expect.any(BaseOptic),
            1: expect.any(BaseOptic),
        });
    });
    it('should yield partial optics when parent optic focus on nullable', () => {
        const { onB, onC } = optic<{ a?: { b: boolean; c: number } }>().focus('a').focusMany(['b', 'c']);
        expectPartial(onB, true);
        expectPartial(onC, true);
    });
});
describe('isMapped', () => {
    const onNumbers = optic<number[]>();
    it('should return false if total optic', () => {
        expect(onNumbers.isMapped()).toBe(false);
    });
    it('should be true if mapped optic', () => {
        expect(onNumbers.map().isMapped()).toBe(true);
    });
    it('should be false if fold optic', () => {
        expect(
            onNumbers
                .map()
                .findFirst((x) => x % 2 === 0)
                .isMapped(),
        ).toBe(false);
    });
});
describe('denormalize', () => {
    const onCities = createStore([
        { name: 'Vienna', inhabitants: 1_897_000, country: 'Österreich' },
        { name: 'Milan', inhabitants: 1_352_000, country: 'Italia' },
    ]);
    const onVienna = onCities.focus(0);
    const onMilan = onCities.focus(1);
    const onPeople = createStore([{ name: 'Pierre', age: 25, driver: false, city: onMilan }]);

    it('should get denormalized state', () => {
        const people = onPeople.getState();
        expect(people).toEqual([
            {
                name: 'Pierre',
                age: 25,
                driver: false,
                city: { name: 'Milan', inhabitants: 1_352_000, country: 'Italia' },
            },
        ]);
    });
    it('should return normalized state', () => {
        const people = onPeople.getState({ denormalize: false });
        expect(people).toEqual([
            {
                name: 'Pierre',
                age: 25,
                driver: false,
                city: onMilan,
            },
        ]);
    });
});
