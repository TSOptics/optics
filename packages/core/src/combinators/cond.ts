import { PartialLens } from '../types';

export const cond = <T>(predicate: (t: T) => boolean): PartialLens<T, T> => ({
    type: 'partial',
    key: 'cond',
    get: (s) => (predicate(s) ? s : undefined),
    set: (a, s) => (predicate(s) ? a : s),
});
