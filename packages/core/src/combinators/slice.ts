import { TotalLens } from '../types';

export const slice = <T>(start?: number, end?: number): TotalLens<T[], T[]> => ({
    key: 'slice',
    get: (s) => s.slice(start, end),
    set: (a, s) => [...s.slice(0, start ?? 0), ...a, ...s.slice(end ?? s.length)],
});
