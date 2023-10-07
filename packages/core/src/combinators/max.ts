import { PartialLens } from '../types';

export const max = <T extends any[]>(
    ...f: T[number] extends number ? [f?: (a: T[number]) => number] : [f: (a: T[number]) => number]
): PartialLens<T[number], T> => {
    const getIndexOfMax = (s: T) => {
        if (s.length === 0) {
            return undefined;
        }
        const ns: number[] = f[0] ? s.map(f[0]) : s;
        return ns.reduce((indexOfMax, cv, currentIndex) => (cv > ns[indexOfMax] ? currentIndex : indexOfMax), 0);
    };

    return {
        type: 'partial',
        key: 'max',
        get: (s) => {
            const index = getIndexOfMax(s);
            return index !== undefined ? s[index] : undefined;
        },
        set: (a, s) => {
            const index = getIndexOfMax(s);
            return s.map((x, i) => (i === index ? a : x)) as T;
        },
    };
};
