import { Optic } from './Optic';
import { createStore } from './Store';
import { total } from './types';
import { noop } from './utils';

const expectType = <T extends any>(t: T) => noop();

describe('denormalize', () => {
    const onCities = createStore([
        { name: 'Vienna', inhabitants: 1_897_000, country: 'Österreich' },
        { name: 'Milan', inhabitants: 1_352_000, country: 'Italia' },
    ]);
    const onMilan = onCities.focus(1);
    const onPeople = createStore([{ name: 'Pierre', age: 25, driver: false, city: onMilan }]);

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
                    country: string;
                };
            }[]
        >(people);
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
        expectType<
            {
                name: string;
                age: number;
                driver: boolean;
                city: Optic<
                    {
                        name: string;
                        inhabitants: number;
                        country: string;
                    },
                    total,
                    {
                        name: string;
                        inhabitants: number;
                        country: string;
                    }[]
                >;
            }[]
        >(people);
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
