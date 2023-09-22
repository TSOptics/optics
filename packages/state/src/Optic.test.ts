import { PureOptic, pureOptic, partial, total, PureReadOptic } from '@optics/core';
import { createState } from './createState';
import { AsyncOptic } from './Optics/AsyncOptic';
import { AsyncReadOptic } from './Optics/AsyncReadOptic';
import { Optic } from './Optics/Optic';
import { ReadOptic } from './Optics/ReadOptic';

const expectType = <T extends any>(t: T) => {};

describe('Optic', () => {
    describe('types', () => {
        it('Optic should be a subtype of Optic', () => {
            const o = {} as Optic<number>;
            const ro: ReadOptic<number> = o;
        });
        it('AsyncReadOptic should be a subtype of ReadOptic', () => {
            const aro = {} as AsyncReadOptic<number>;
            const ro: ReadOptic<number> = aro;
        });
        it('AsyncOptic should be a subtype of Optic', () => {
            const ao = {} as AsyncOptic<number>;
            const ro: Optic<number> = ao;
        });
        it('Optics should not be subtypes of PureOptic', () => {
            const ro = {} as ReadOptic<number>;
            // @ts-expect-error
            const po: PureOptic<number> = ro;
        });
        it('should be invariant on focused type', () => {
            let stringOrNumberOptic = {} as Optic<number | string>;
            // @ts-expect-error
            const numberOptic: Optic<string> = stringOrNumberOptic;
            // @ts-expect-error
            stringOrNumberOptic = numberOptic;
        });
        it('should be covariant on optic type', () => {
            let numberTotalOptic = {} as Optic<number>;
            const numberPartialOptic: Optic<number, partial> = numberTotalOptic;
            // @ts-expect-error
            numberTotalOptic = numberPartialOptic;
        });
        it('should return the same type when composed with PureOptic', () => {
            const stateOptic = createState({ a: { b: 42 } });
            const numberFromStateOptic = stateOptic.a.derive(pureOptic<{ b: number }>().b);
            expectType<Optic<number, total>>(numberFromStateOptic);
        });
        it('should return a read only type when composed with PureReadOptic', () => {
            expectType<Optic<number>>(
                // @ts-expect-error ReadOptic isn't assignable to Optic
                createState({ a: { b: 42 } }).a.derive((pureOptic<{ b: number }>() as PureReadOptic<{ b: number }>).b),
            );
            expectType<AsyncOptic<number>>(
                // @ts-expect-error AsyncReadOptic isn't assignable to AsyncOptic
                (createState({ a: { b: 42 } }) as AsyncOptic<{ a: { b: number } }>).a.derive(
                    (pureOptic<{ b: number }>() as PureReadOptic<{ b: number }>).b,
                ),
            );
        });
        it('should return a read only optic when derived with get function', () => {
            const stateOptic = createState({ a: { b: 42 } });
            const numberOptic = stateOptic.a.derive({ get: (x) => x.b });
            // @ts-expect-error ReadOptic isn't assignable to Optic
            expectType<Optic<number>>(numberOptic);
        });
        it('should return an optic when derived with get and set function', () => {
            const stateOptic = createState({ a: { b: 42 } });
            const numberOptic = stateOptic.a.derive({ get: (x) => x.b, set: (b, x) => ({ ...x, b }) });
            expectType<Optic<number>>(numberOptic);
        });
    });
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
    describe('pipe', () => {
        it('should pipe unary functions and return the last function result', () => {
            const endResult = createState({ foo: { bar: 42 } })
                .pipe((fooOptic) => fooOptic.foo)
                .pipe((barOptic) => barOptic.bar)
                .pipe(
                    (optic) => optic.get(),
                    (n) => n * 2,
                    (n) => n + 10,
                    (n) => n.toString(),
                    (s) => s.split(''),
                );
            expect(endResult).toEqual(['9', '4']);
        });
    });

    describe('references', () => {
        const countriesOptic = createState([
            { name: 'Italia', language: 'Italiano' },
            { name: 'Österreich', language: 'Deutsch' },
        ]);
        const onÖsterreich = countriesOptic[1];
        const citiesOptic = createState([
            { name: 'Wien', inhabitants: 1_897_000, country: countriesOptic[1] },
            { name: 'Milano', inhabitants: 1_352_000, country: countriesOptic[0] },
        ]);
        const wienOptic = citiesOptic[0];
        const milanoOptic = citiesOptic[1];
        const peopleOptic = createState([{ name: 'Franz', age: 25, driver: false, city: wienOptic }]);
        beforeEach(() => {
            countriesOptic.reset();
            citiesOptic.reset();
            peopleOptic.reset();
        });
        it('should return denormalized state', () => {
            citiesOptic.get();
            const people = peopleOptic.get();
            expectType<
                {
                    name: string;
                    age: number;
                    driver: boolean;
                    city: {
                        name: string;
                        inhabitants: number;
                        country: { name: string; language: string };
                    };
                }[]
            >(people);
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
            expectType<
                {
                    name: string;
                    age: number;
                    driver: boolean;
                    city: Optic<{
                        name: string;
                        inhabitants: number;
                        country: Optic<{ name: string; language: string }>;
                    }>;
                }[]
            >(people);
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
            const denormalizedFranz = franzOptic.get();

            wienOptic.inhabitants.set((prev) => prev + 1);
            expect(franzOptic.get({ denormalize: false })).toBe(normalizedFranz);
            expect(franzOptic.get()).not.toBe(denormalizedFranz);
        });
        describe('subscribe', () => {
            const franzOptic = peopleOptic[0];
            it('should subscribe to denormalized state', () => {
                const listener = jest.fn();
                const unsubscribe = franzOptic.subscribe(listener);

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
                franzOptic.subscribe(listener);

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
                expect(citiesOptic.get()).toEqual([
                    { name: 'Paris', inhabitants: 2_148_000 },
                    { name: 'Lyon', inhabitants: 513_000 },
                ]);
            });
            it('should subscribe to reference changes', () => {
                const citiesOptic = franceOptic.cities;
                const listener = jest.fn();
                citiesOptic.subscribe(listener);
                parisOptic.inhabitants.set((prev) => prev + 1);
                expect(listener).toHaveBeenCalledWith([
                    { name: 'Paris', inhabitants: 2_148_001 },
                    { name: 'Lyon', inhabitants: 513_000 },
                ]);
            });
        });
    });
    describe('Referential stability', () => {
        const state = createState({ n: 42, array: [1, 2, 3, 4] });
        const array = state.array;
        const n = state.n;
        describe('map reduce', () => {
            const numbers = array.map();
            it('map', () => {
                const value = numbers.get();
                n.set((prev) => prev + 1);
                expect(value).toBe(numbers.get());
            });
            it('reduceFilter', () => {
                const evenNumbers = numbers.reduceFilter((x) => x % 2 === 0);
                const value = evenNumbers.get();
                n.set((prev) => prev + 1);
                expect(value).toBe(evenNumbers.get());
            });
            it('reduceFindFirst', () => {
                const firstEvenNumber = numbers.reduceFindFirst((x) => x % 2 === 0);
                const value = firstEvenNumber.get();
                n.set((prev) => prev + 1);
                expect(value).toBe(firstEvenNumber.get());
            });
            it('reduceSort', () => {
                const descNumbers = numbers.reduceSort((a, b) => b - a);
                const value = descNumbers.get();
                n.set((prev) => prev + 1);
                expect(value).toBe(descNumbers.get());
            });
            it('reduceSlice', () => {
                const firstTwoNumbers = numbers.reduceSlice(0, 2);
                const value = firstTwoNumbers.get();
                n.set((prev) => prev + 1);
                expect(value).toBe(firstTwoNumbers.get());
            });
        });
        describe('array combinators', () => {
            it('slice', () => {
                const firstTwoNumbers = array.slice(0, 2);
                const value = firstTwoNumbers.get();
                n.set((prev) => prev + 1);
                expect(value).toBe(firstTwoNumbers.get());
            });
            it('reverse', () => {
                const reversedArray = array.reverse();
                const value = reversedArray.get();
                n.set((prev) => prev + 1);
                expect(value).toBe(reversedArray.get());
            });
            it('indexBy', () => {
                const indexed = array.indexBy((x) => `${x}`);
                const value = indexed.get();
                n.set((prev) => prev + 1);
                expect(value).toBe(indexed.get());
            });
        });
        describe('record combinators', () => {
            const state = createState({ obj: { b1: true, b2: false } as Record<string, boolean>, a: 42 });
            it('values', () => {
                const values = state.obj.values();
                const value = values.get();

                state.a.set((prev) => prev + 1);
                expect(values.get()).toBe(value);
            });
            it('entries', () => {
                const entries = state.obj.entries();
                const value = entries.get();

                state.a.set((prev) => prev + 1);
                expect(entries.get()).toBe(value);
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
});
