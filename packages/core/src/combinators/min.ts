import { PartialLens } from '../types';

export const min = <T extends any[]>(
    ...f: T[number] extends number ? [f?: (a: T[number]) => number] : [f: (a: T[number]) => number]
): PartialLens<T[number], T> => {
    const getIndexOfMin = (s: T) => {
        if (s.length === 0) {
            return undefined;
        }
        const ns: number[] = f[0] ? s.map(f[0]) : s;
        return ns.reduce((indexOfMin, cv, currentIndex) => (cv < ns[indexOfMin] ? currentIndex : indexOfMin), 0);
    };

    return {
        type: 'partial',
        key: 'min',
        get: (s) => {
            const index = getIndexOfMin(s);
            return index !== undefined ? s[index] : undefined;
        },
        set: (a, s) => {
            const index = getIndexOfMin(s);
            return s.map((x, i) => (i === index ? a : x)) as T;
        },
    };
};
