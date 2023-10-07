import { TotalLens } from '../types';

export const reverse = <T>(): TotalLens<T[], T[]> => ({
    key: 'reverse',
    get: (s) => [...s].reverse(),
    set: (a) => [...a].reverse(),
});
