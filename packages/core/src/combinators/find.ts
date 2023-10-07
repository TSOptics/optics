import { PartialLens } from '../types';

export const find = <T>(predicate: (t: T) => boolean): PartialLens<T, T[]> => ({
    type: 'partial',
    key: 'find',
    get: (s) => s.find(predicate),
    set: (a, s) => {
        const index = s.findIndex(predicate);
        if (index === -1) {
            return s;
        }
        return s.map((x, i) => (i === index ? a : x));
    },
});
