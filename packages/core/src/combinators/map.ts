import { MapLens } from '../types';

export const map = (): MapLens => ({
    type: 'map',
    key: 'map',
    get: (s) => s,
    set: (a) => a,
});
