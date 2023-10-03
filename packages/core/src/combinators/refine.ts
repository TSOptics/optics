import { PartialLens } from '../types';

export const refine = <A, B extends A>(refiner: (a: A) => false | B): PartialLens<B, A> => ({
    type: 'partial',
    key: 'refine',
    get: (s) => {
        const refined = refiner(s);
        return refined !== false ? refined : undefined;
    },
    set: (a, s) => (refiner(s) !== false ? a : s),
});
