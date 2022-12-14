import { pureOptic } from '../pureOptic';
import { PureOptic } from '../PureOptic.types';
import { partial, total } from '../types';
import { noop } from '../utils';
import { Optic } from './Optic.types';
import { createStore } from './store';

const expectType = <T extends any>(t: T) => noop();

describe('Optic', () => {
    describe('types', () => {
        it('should be a subtype of Optic', () => {
            const storeOptic = {} as Optic<number>;
            const baseOptic: PureOptic<number> = storeOptic;
        });
        it('should be covariant on type param TOpticType', () => {
            const storeOptic = {} as Optic<number>;
            const basePartialOptic: PureOptic<number, partial> = storeOptic;
            const storePartialOptic: Optic<number, partial> = storeOptic;
        });
        it('should compose with plain optics', () => {
            const onState = createStore({ a: { b: 42 } });
            const onNumber = pureOptic<{ b: number }>().focus('b');
            const onNumberFromState = onState.focus('a').compose(onNumber);
            expectType<Optic<number, total, { a: { b: number } }>>(onNumberFromState);
            expect(onNumberFromState.get()).toBe(42);
        });
        describe('get and set state', () => {
            const onState = createStore({ a: 42 });
            expect(onState.get()).toEqual({ a: 42 });

            onState.set({ a: 100 });
            expect(onState.get()).toEqual({ a: 100 });

            const onNumber = onState.focus('a');
            const listener = jest.fn();
            onNumber.subscribe(listener);
            onState.set({ a: 42 });
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(42);
        });
    });
    describe('denormalize', () => {
        const onCountries = createStore([
            { name: 'Italia', language: 'Italiano' },
            { name: 'Österreich', language: 'Deutsch' },
        ]);
        const onÖsterreich = onCountries.focus(1);
        const onCities = createStore([
            { name: 'Wien', inhabitants: 1_897_000, country: onCountries.focus(1) },
            { name: 'Milano', inhabitants: 1_352_000, country: onCountries.focus(0) },
        ]);
        const onWien = onCities.focus(0);
        const onMilano = onCities.focus(1);
        const onPeople = createStore([{ name: 'Franz', age: 25, driver: false, city: onWien }]);
        beforeEach(() => {
            onCountries.reset();
            onCities.reset();
            onPeople.reset();
        });

        it('should return denormalized state', () => {
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
            expect(people).toEqual([
                {
                    name: 'Franz',
                    age: 25,
                    driver: false,
                    city: onWien,
                },
            ]);
        });
        it('should have separate cache for normalized and denormalized data', () => {
            const onFranz = onPeople.focus(0);

            const normalizedFranz = onFranz.get({ denormalize: false });
            const denormalizedFranz = onFranz.get();

            onWien.focus('inhabitants').set((prev) => prev + 1);
            expect(onFranz.get({ denormalize: false })).toBe(normalizedFranz);
            expect(onFranz.get()).not.toBe(denormalizedFranz);
        });
        describe('subscribe', () => {
            const onFranz = onPeople.focus(0);
            it('should subscribe to denormalized state', () => {
                const listener = jest.fn();
                const unsubscribe = onFranz.subscribe(listener);

                onFranz.focus('driver').set(true);

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

                onWien.focus('inhabitants').set((prev) => prev + 1);

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

                onÖsterreich.focus('language').set('Österreichisches Deutsch');
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

                onWien.focus('inhabitants').set((prev) => prev - 1);
                expect(listener).toHaveBeenCalledTimes(3);
            });
            it('should subscribe to normalized state', () => {
                const listener = jest.fn();
                const unsubscribe = onFranz.subscribe(listener, { denormalize: false });

                onFranz.focus('age').set((prev) => prev + 1);

                expect(listener).toHaveBeenCalledWith({ name: 'Franz', age: 26, driver: false, city: onWien });

                onWien.focus('inhabitants').set((prev) => prev + 1);

                expect(listener).toHaveBeenCalledTimes(1);

                unsubscribe();

                onFranz.focus('city').set(onMilano);

                expect(listener).toHaveBeenCalledTimes(1);
            });
            it('should work when changing dependency', () => {
                const listener = jest.fn();
                onFranz.subscribe(listener);

                onFranz.focus('city').set(onMilano);
                expect(listener).toHaveBeenCalledWith({
                    name: 'Franz',
                    age: 25,
                    driver: false,
                    city: { name: 'Milano', inhabitants: 1_352_000, country: { name: 'Italia', language: 'Italiano' } },
                });

                onWien.focus('inhabitants').set((prev) => prev + 1);
                expect(listener).toHaveBeenCalledTimes(1);

                onCountries.focus(0).focus('name').set('Repubblica Italiana');
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
});
