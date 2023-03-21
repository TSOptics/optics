import { total } from '@optix/core';
import OpticImpl from './Optic.impl';
import { Optic } from './Optics/Optic';

export function createState<T>(initialValue: T, key?: string): Optic<T, total> {
    const rootOptic = new OpticImpl<T, total>(
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
