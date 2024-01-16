import OpticImpl from './Optic.impl';
import { Optic } from './Optics/Optic';

export function createState<T>(initialValue: T, key?: string): Optic<T> {
    const rootOptic = new OpticImpl<T>(
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
