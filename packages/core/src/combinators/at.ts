import { PartialLens } from '../types';

export const at = <T>(index: number): PartialLens<T, T[]> => ({
    type: 'partial',
    get: (s) => s[index < 0 ? index + s.length : index],
    set: (a, s) => {
        const absIndex = index < 0 ? index + s.length : index;
        return s.map((x, i) => (i === absIndex ? a : x));
    },
    key: 'at',
});
