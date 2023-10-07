import { TotalLens } from '../types';

export const values = <T>(): TotalLens<T[], Record<string, T>> => ({
    get: (s) => Object.values(s),
    set: (a, s) => {
        const keys = Object.keys(s);
        return keys.reduce<Record<string, T>>((acc, key, index) => {
            acc[key] = a[index];
            return acc;
        }, {});
    },
    key: 'values',
});
