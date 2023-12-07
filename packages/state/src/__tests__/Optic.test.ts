import { pureOptic } from '@optics/core';
import { createState } from '../createState';
import { entries, indexBy, reverse, slice, values } from '../combinators';

describe('get and set state', () => {
    const stateOptic = createState({ a: 42 });
    expect(stateOptic.get()).toEqual({ a: 42 });

    stateOptic.set({ a: 100 });
    expect(stateOptic.get()).toEqual({ a: 100 });

    const numberOptic = stateOptic.a;
    const listener = jest.fn();
    numberOptic.subscribe(listener);
    stateOptic.set({ a: 42 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(42);
});
describe('derive', () => {
    it('should compose with PureOptic', () => {
        const stateOptic = createState({ a: { b: 42 } });
        const numberOptic = pureOptic<{ b: number }>().b;
        const numberFromStateOptic = stateOptic.a.derive(numberOptic);
        expect(numberFromStateOptic.get()).toBe(42);
        numberFromStateOptic.set(100);
        expect(stateOptic.get()).toEqual({ a: { b: 100 } });
    });
    it('should derive read only optic from get', () => {
        const stateOptic = createState({ a: { b: 42 } });
        const numberOptic = stateOptic.a.derive({ get: (x) => x.b });
        expect(numberOptic.get()).toBe(42);
    });
    it('should derive an optic from get and set', () => {
        const stateOptic = createState({ a: { b: 42 } });
        const numberOptic = stateOptic.a.derive({ get: (x) => x.b, set: (b, x) => ({ ...x, b }) });
        expect(numberOptic.get()).toBe(42);
        numberOptic.set(100);
        expect(stateOptic.get()).toEqual({ a: { b: 100 } });
    });
});
describe('references', () => {
    const countries = [
        { name: 'Italia', language: 'Italiano' },
        { name: 'Österreich', language: 'Deutsch' },
    ];
    const countriesOptic = createState(countries);
    const onÖsterreich = countriesOptic[1];
    const cities = [
        { name: 'Wien', inhabitants: 1897000, country: countriesOptic[1] },
        { name: 'Milano', inhabitants: 1352000, country: countriesOptic[0] },
    ];
    const citiesOptic = createState(cities);
    const wienOptic = citiesOptic[0];
    const milanoOptic = citiesOptic[1];
    const people = [{ name: 'Franz', age: 25, driver: false, city: wienOptic }];
    const peopleOptic = createState(people);
    beforeEach(() => {
        countriesOptic.set(countries);
        citiesOptic.set(cities);
        peopleOptic.set(people);
    });
    it('should return denormalized state', () => {
        citiesOptic.get();
        const people = peopleOptic.get({ denormalize: true });
        expect(people).toEqual([
            {
                name: 'Franz',
                age: 25,
                driver: false,
                city: {
                    name: 'Wien',
                    inhabitants: 1_897_000,
                    country: { name: 'Österreich', language: 'Deutsch' },
                },
            },
        ]);
    });
    it('should return normalized state', () => {
        const people = peopleOptic.get({ denormalize: false });
        expect(people).toStrictEqual([
            {
                name: 'Franz',
                age: 25,
                driver: false,
                city: wienOptic,
            },
        ]);
    });
    it('should have separate cache for normalized and denormalized data', () => {
        const franzOptic = peopleOptic[0];

        const normalizedFranz = franzOptic.get({ denormalize: false });
        const denormalizedFranz = franzOptic.get({ denormalize: true });

        wienOptic.inhabitants.set((prev) => prev + 1);
        expect(franzOptic.get({ denormalize: false })).toBe(normalizedFranz);
        expect(franzOptic.get({ denormalize: true })).not.toBe(denormalizedFranz);
    });
    describe('subscribe', () => {
        const franzOptic = peopleOptic[0];
        it('should subscribe to denormalized state', () => {
            const listener = jest.fn();
            const unsubscribe = franzOptic.subscribe(listener, { denormalize: true });

            franzOptic.driver.set(true);

            expect(listener).toHaveBeenCalledWith({
                name: 'Franz',
                age: 25,
                driver: true,
                city: {
                    name: 'Wien',
                    inhabitants: 1_897_000,
                    country: { name: 'Österreich', language: 'Deutsch' },
                },
            });

            wienOptic.inhabitants.set((prev) => prev + 1);

            expect(listener).lastCalledWith({
                name: 'Franz',
                age: 25,
                driver: true,
                city: {
                    name: 'Wien',
                    inhabitants: 1_897_001,
                    country: { name: 'Österreich', language: 'Deutsch' },
                },
            });

            onÖsterreich.language.set('Österreichisches Deutsch');
            expect(listener).toHaveBeenCalledWith({
                name: 'Franz',
                age: 25,
                driver: true,
                city: {
                    name: 'Wien',
                    inhabitants: 1_897_001,
                    country: { name: 'Österreich', language: 'Österreichisches Deutsch' },
                },
            });

            unsubscribe();

            wienOptic.inhabitants.set((prev) => prev - 1);
            expect(listener).toHaveBeenCalledTimes(3);
        });
        it('should subscribe to normalized state', () => {
            const listener = jest.fn();
            const unsubscribe = franzOptic.subscribe(listener, { denormalize: false });

            franzOptic.age.set((prev) => prev + 1);

            expect(listener).toHaveBeenCalledWith({ name: 'Franz', age: 26, driver: false, city: wienOptic });

            wienOptic.inhabitants.set((prev) => prev + 1);

            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();

            franzOptic.city.set(milanoOptic);

            expect(listener).toHaveBeenCalledTimes(1);
        });
        it('should work when changing dependency', () => {
            const listener = jest.fn();
            franzOptic.subscribe(listener, { denormalize: true });

            franzOptic.city.set(milanoOptic);
            expect(listener).toHaveBeenCalledWith({
                name: 'Franz',
                age: 25,
                driver: false,
                city: { name: 'Milano', inhabitants: 1_352_000, country: { name: 'Italia', language: 'Italiano' } },
            });

            wienOptic.inhabitants.set((prev) => prev + 1);
            expect(listener).toHaveBeenCalledTimes(1);

            countriesOptic[0].name.set('Repubblica Italiana');
            expect(listener).toHaveBeenCalledWith({
                name: 'Franz',
                age: 25,
                driver: false,
                city: {
                    name: 'Milano',
                    inhabitants: 1_352_000,
                    country: { name: 'Repubblica Italiana', language: 'Italiano' },
                },
            });
            expect(listener).toHaveBeenCalledTimes(2);
        });
    });
    describe('references in arrays', () => {
        const parisOptic = createState({ name: 'Paris', inhabitants: 2_148_000 });
        const lyonOptic = createState({ name: 'Lyon', inhabitants: 513_000 });
        const franceOptic = createState({ name: 'France', cities: [parisOptic, lyonOptic] });
        it('should denormalize references', () => {
            const citiesOptic = franceOptic.cities;
            expect(citiesOptic.get({ denormalize: true })).toEqual([
                { name: 'Paris', inhabitants: 2_148_000 },
                { name: 'Lyon', inhabitants: 513_000 },
            ]);
        });
        it('should subscribe to reference changes', () => {
            const citiesOptic = franceOptic.cities;
            const listener = jest.fn();
            citiesOptic.subscribe(listener, { denormalize: true });
            parisOptic.inhabitants.set((prev) => prev + 1);
            expect(listener).toHaveBeenCalledWith([
                { name: 'Paris', inhabitants: 2_148_001 },
                { name: 'Lyon', inhabitants: 513_000 },
            ]);
        });
    });
});
describe('Referential stability', () => {
    const stateOptic = createState({ n: 42, array: [1, 2, 3, 4] });
    const arrayOptic = stateOptic.array;
    const nOptic = stateOptic.n;
    describe('map reduce', () => {
        const numbersOptic = arrayOptic.map();
        it('map', () => {
            const value = numbersOptic.get();
            nOptic.set((prev) => prev + 1);
            expect(value).toBe(numbersOptic.get());
        });
        it('reduceFilter', () => {
            const evenNumbers = numbersOptic.reduce((values) => values.filter(({ value }) => value % 2 === 0));
            const value = evenNumbers.get();
            nOptic.set((prev) => prev + 1);
            expect(value).toBe(evenNumbers.get());
        });
        it('reduceFindFirst', () => {
            const firstEvenNumber = numbersOptic.reduce((values) => values.find(({ value }) => value % 2 === 0));
            const value = firstEvenNumber.get();
            nOptic.set((prev) => prev + 1);
            expect(value).toBe(firstEvenNumber.get());
        });
        it('reduceSort', () => {
            const descNumbers = numbersOptic.reduce((values) => values.sort((a, b) => b.value - a.value));
            const value = descNumbers.get();
            nOptic.set((prev) => prev + 1);
            expect(value).toBe(descNumbers.get());
        });
        it('reduceSlice', () => {
            const firstTwoNumbers = numbersOptic.reduce((values) => values.slice(0, 2));
            const value = firstTwoNumbers.get();
            nOptic.set((prev) => prev + 1);
            expect(value).toBe(firstTwoNumbers.get());
        });
    });
    describe('reduce', () => {
        const usersOptic = createState([
            { contact: { phone: '+33**' } },
            { contact: { phone: '+44**' } },
            { contact: { phone: '+33**' } },
        ]);
        const frenchPhonesOptic = usersOptic
            .map()
            .contact.reduce((values) => values.filter(({ value }) => value.phone.startsWith('+33'))).phone;
        it('should return the same value if none of the focused values changed', () => {
            const value = frenchPhonesOptic.get();
            usersOptic[1].contact.phone.set((prev) => prev + '**');
            expect(value).toBe(frenchPhonesOptic.get());
        });
        it("should return the same value if the only focused value didn't changed", () => {
            const firstFrenchPhoneOptic = frenchPhonesOptic.reduce((values) => values[0]);
            const firstFrenchPhone = firstFrenchPhoneOptic.get();
            usersOptic[2].contact.phone.set((prev) => prev + '**');
            expect(firstFrenchPhone).toBe(firstFrenchPhoneOptic.get());
        });
    });
    describe('array combinators', () => {
        it('slice', () => {
            const firstTwoNumbers = arrayOptic.derive(slice(0, 2));
            const value = firstTwoNumbers.get();
            nOptic.set((prev) => prev + 1);
            expect(value).toBe(firstTwoNumbers.get());
        });
        it('reverse', () => {
            const reversedArray = arrayOptic.derive(reverse());
            const value = reversedArray.get();
            nOptic.set((prev) => prev + 1);
            expect(value).toBe(reversedArray.get());
        });
        it('indexBy', () => {
            const indexed = arrayOptic.derive(indexBy((x) => `${x}`));
            const value = indexed.get();
            nOptic.set((prev) => prev + 1);
            expect(value).toBe(indexed.get());
        });
    });
    describe('record combinators', () => {
        const state = createState({ obj: { b1: true, b2: false } as Record<string, boolean>, a: 42 });
        it('values', () => {
            const valuesOptic = state.obj.derive(values());
            const value = valuesOptic.get();

            state.a.set((prev) => prev + 1);
            expect(valuesOptic.get()).toBe(value);
        });
        it('entries', () => {
            const entriesOptic = state.obj.derive(entries());
            const value = entriesOptic.get();

            state.a.set((prev) => prev + 1);
            expect(entriesOptic.get()).toBe(value);
        });
    });
    it('derive', () => {
        const stateOptic = createState({ obj: { b1: true, b2: false }, a: 42 });
        const tupleOptic = stateOptic.obj.derive({
            get: ({ b1, b2 }) => [b1, b2] as const,
            set: ([b1, b2]) => ({ b1, b2 }),
        });
        const tuple = tupleOptic.get();

        stateOptic.a.set((prev) => prev + 1);
        expect(tupleOptic.get()).toBe(tuple);
    });
    it('derive from pureOptic', () => {
        const stateOptic = createState({ obj: { b1: true, b2: false }, a: 42 });
        const tupleOptic = stateOptic.obj.derive(
            pureOptic<{ b1: boolean; b2: boolean }>().derive({
                get: ({ b1, b2 }) => [b1, b2] as const,
                set: ([b1, b2]) => ({ b1, b2 }),
            }),
        );
        const tuple = tupleOptic.get();

        stateOptic.a.set((prev) => prev + 1);
        expect(tupleOptic.get()).toBe(tuple);
    });
});
