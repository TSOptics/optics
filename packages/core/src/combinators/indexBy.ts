import { TotalLens } from '../types';

export const indexBy = <T, Key extends string | number>(getKey: (t: T) => Key): TotalLens<Record<Key, T>, T[]> => ({
    get: (s) => {
        return s.reduce((acc, cv) => {
            acc[getKey(cv)] = cv;
            return acc;
        }, {} as Record<Key, T>);
    },
    set: (a, s) => {
        const keys = { ...a };
        return s.reduceRight<T[]>((acc, cv) => {
            const key = getKey(cv);
            acc.unshift(keys[key] ?? cv);
            delete keys[key];
            return acc;
        }, []);
    },
});
