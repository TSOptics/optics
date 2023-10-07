import { TotalLens } from '../types';

export const sort = <T>(
    compareFn: (a: T, b: T) => number = (a: T, b: T) => (`${a}` < `${b}` ? -1 : 1),
): TotalLens<T[], T[]> => ({
    get: (s) => [...s].sort(compareFn),
    set: (a) => a,
});
