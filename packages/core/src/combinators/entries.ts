import { TotalLens } from '../types';

export const entries = <T>(): TotalLens<[string, T][], Record<string, T>> => ({
    get: (s) => Object.entries(s),
    set: (a) => Object.fromEntries(a),
    key: 'entries',
});
