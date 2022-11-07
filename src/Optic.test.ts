import { Optic } from './Optic';
import { createStore } from './Store';
import { noop } from './utils';

const expectType = <T extends any>(t: T) => noop();

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
        const people = onPeople.getState();
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
                city: { name: 'Wien', inhabitants: 1_897_000, country: { name: 'Österreich', language: 'Deutsch' } },
            },
        ]);
    });
    it('should return normalized state', () => {
        const people = onPeople.getState({ denormalize: false });
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
    describe('subscribe', () => {
        const onFranz = onPeople.focus(0);
        it('should subscribe to denormalized state', () => {
            const listener = jest.fn();
            const unsubscribe = onFranz.subscribe(listener);

            onFranz.focus('driver').setState(true);

            expect(listener).toHaveBeenCalledWith({
                name: 'Franz',
                age: 25,
                driver: true,
                city: { name: 'Wien', inhabitants: 1_897_000, country: { name: 'Österreich', language: 'Deutsch' } },
            });

            onWien.focus('inhabitants').setState((prev) => prev + 1);

            expect(listener).toHaveBeenCalledWith({
                name: 'Franz',
                age: 25,
                driver: true,
                city: { name: 'Wien', inhabitants: 1_897_001, country: { name: 'Österreich', language: 'Deutsch' } },
            });

            onÖsterreich.focus('language').setState('Österreichisches Deutsch');
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

            onWien.focus('inhabitants').setState((prev) => prev - 1);
            expect(listener).toHaveBeenCalledTimes(3);
        });
        it('should subscribe to normalized state', () => {
            const listener = jest.fn();
            const unsubscribe = onFranz.subscribe(listener, { denormalize: false });

            onFranz.focus('age').setState((prev) => prev + 1);

            expect(listener).toHaveBeenCalledWith({ name: 'Franz', age: 26, driver: false, city: onWien });

            onWien.focus('inhabitants').setState((prev) => prev + 1);

            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();

            onFranz.focus('city').setState(onMilano);

            expect(listener).toHaveBeenCalledTimes(1);
        });
        it('should work when changing dependency', () => {
            const listener = jest.fn();
            onFranz.subscribe(listener);

            onFranz.focus('city').setState(onMilano);
            expect(listener).toHaveBeenCalledWith({
                name: 'Franz',
                age: 25,
                driver: false,
                city: { name: 'Milano', inhabitants: 1_352_000, country: { name: 'Italia', language: 'Italiano' } },
            });

            onWien.focus('inhabitants').setState((prev) => prev + 1);
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });
});
