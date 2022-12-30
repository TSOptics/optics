import { total } from '@optix/core';
import OpticImpl from './Optic.impl';
import { Optic } from './Optic.types';

export function createState<T>(initialValue: T, key?: string): Optic<T, total, T> {
    const rootOptic = new OpticImpl<T, total, T>(
        [
            {
                key: key ?? 'store',
                get: (s) => s,
                set: (a) => a,
            },
        ],
        initialValue,
    );
    return rootOptic as any;
}
