import { total } from '../types';
import { DataOptic } from './DataOptic';
import DataOpticImpl from './DataOptic.impl';

export const focusOn = <T>(value: T, key?: string): DataOptic<T, total, T> => {
    const dataOptic = new DataOpticImpl(
        [
            {
                key: key ?? 'focus',
                get: (s) => s,
                set: (a) => a,
            },
        ],
        value,
    );
    return dataOptic as any;
};
