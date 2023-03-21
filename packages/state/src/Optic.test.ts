import { PureOptic } from '@optix/core';
import { pureOptic } from '@optix/core/src/pureOptic';
import { partial, total } from '@optix/core/src/types';
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
            let onStringOrNumber = {} as Optic<number | string>;
            // @ts-expect-error
            const onNumber: Optic<string> = onStringOrNumber;
            // @ts-expect-error
            onStringOrNumber = onNumber;
        });
        it('should be covariant on optic type', () => {
            let onNumberTotal = {} as Optic<number>;
            const onNumberPartial: Optic<number, partial> = onNumberTotal;
            // @ts-expect-error
            onNumberTotal = onNumberPartial;
        });
        it('should compose with plain optics', () => {
            const onState = createState({ a: { b: 42 } });
            const onNumber = pureOptic<{ b: number }>().b;
            const onNumberFromState = onState.a.compose(onNumber);
            expectType<Optic<number, total, { a: { b: number } }>>(onNumberFromState);
            expect(onNumberFromState.get()).toBe(42);
        });
    });
    describe('get and set state', () => {
        const onState = createState({ a: 42 });
        expect(onState.get()).toEqual({ a: 42 });

        onState.set({ a: 100 });
        expect(onState.get()).toEqual({ a: 100 });

        const onNumber = onState.a;
        const listener = jest.fn();
        onNumber.subscribe(listener);
        onState.set({ a: 42 });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(42);
    });
    describe('denormalize', () => {
        const onCountries = createState([
            { name: 'Italia', language: 'Italiano' },
            { name: 'Österreich', language: 'Deutsch' },
        ]);
        const onÖsterreich = onCountries[1];
        const onCities = createState([
            { name: 'Wien', inhabitants: 1_897_000, country: onCountries[1] },
            { name: 'Milano', inhabitants: 1_352_000, country: onCountries[0] },
        ]);
        const onWien = onCities[0];
        const onMilano = onCities[1];
        const onPeople = createState([{ name: 'Franz', age: 25, driver: false, city: onWien }]);
        beforeEach(() => {
            onCountries.reset();
            onCities.reset();
            onPeople.reset();
        });
        it('should return denormalized state', () => {
            onCities.get();
            const people = onPeople.get();
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
            const people = onPeople.get({ denormalize: false });
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
                    city: onWien,
                },
            ]);
        });
        it('should have separate cache for normalized and denormalized data', () => {
            const onFranz = onPeople[0];

            const normalizedFranz = onFranz.get({ denormalize: false });
            const denormalizedFranz = onFranz.get();

            onWien.inhabitants.set((prev) => prev + 1);
            expect(onFranz.get({ denormalize: false })).toBe(normalizedFranz);
            expect(onFranz.get()).not.toBe(denormalizedFranz);
        });
        describe('subscribe', () => {
            const onFranz = onPeople[0];
            it('should subscribe to denormalized state', () => {
                const listener = jest.fn();
                const unsubscribe = onFranz.subscribe(listener);

                onFranz.driver.set(true);

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

                onWien.inhabitants.set((prev) => prev + 1);

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

                onWien.inhabitants.set((prev) => prev - 1);
                expect(listener).toHaveBeenCalledTimes(3);
            });
            it('should subscribe to normalized state', () => {
                const listener = jest.fn();
                const unsubscribe = onFranz.subscribe(listener, { denormalize: false });

                onFranz.age.set((prev) => prev + 1);

                expect(listener).toHaveBeenCalledWith({ name: 'Franz', age: 26, driver: false, city: onWien });

                onWien.inhabitants.set((prev) => prev + 1);

                expect(listener).toHaveBeenCalledTimes(1);

                unsubscribe();

                onFranz.city.set(onMilano);

                expect(listener).toHaveBeenCalledTimes(1);
            });
            it('should work when changing dependency', () => {
                const listener = jest.fn();
                onFranz.subscribe(listener);

                onFranz.city.set(onMilano);
                expect(listener).toHaveBeenCalledWith({
                    name: 'Franz',
                    age: 25,
                    driver: false,
                    city: { name: 'Milano', inhabitants: 1_352_000, country: { name: 'Italia', language: 'Italiano' } },
                });

                onWien.inhabitants.set((prev) => prev + 1);
                expect(listener).toHaveBeenCalledTimes(1);

                onCountries[0].name.set('Repubblica Italiana');
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
    });
    describe('Referential stability', () => {
        it("should return the same value if the array didn't change", () => {
            const onState = createState({ a: 42, b: [1, 2, 3, 4] });
            const onB = onState.b.map().reduceFilter((x) => x % 2 === 0);

            const b = onB.get();
            onState.a.set((prev) => prev + 1);
            expect(b).toBe(onB.get());
        });
        it("should return the same converted value if the source didn't change", () => {
            const onState = createState({ obj: { b1: true, b2: false }, a: 42 });
            const onTuple = onState.obj.convert(
                ({ b1, b2 }) => [b1, b2] as const,
                ([b1, b2]) => ({ b1, b2 }),
            );
            const tuple = onTuple.get();

            onState.a.set((prev) => prev + 1);
            expect(onTuple.get()).toBe(tuple);
        });
        it("should return the same value fed to the pure optic didn't change", () => {
            const onState = createState({ obj: { b1: true, b2: false }, a: 42 });
            const onTuple = onState.obj.compose(
                pureOptic(
                    ({ b1, b2 }: { b1: boolean; b2: boolean }) => [b1, b2] as const,
                    ([b1, b2]) => ({ b1, b2 }),
                ),
            );
            const tuple = onTuple.get();

            onState.a.set((prev) => prev + 1);
            expect(onTuple.get()).toBe(tuple);
        });
    });
});
