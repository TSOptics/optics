import { PartialLens } from '../types';

export const toPartial = <T>(): PartialLens<T, T> => ({
    type: 'partial',
    key: 'toPartial',
    get: (s) => s,
    set: (a) => a,
});
