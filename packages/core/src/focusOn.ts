import { DataOptic } from './DataOptic/DataOptic';
import DataOpticImpl from './DataOptic/DataOptic.impl';
import { PureOptic } from './PureOptic/PureOptic';
import PureOpticImpl from './PureOptic/PureOptic.impl';

export function focusOn<T>(): PureOptic<T, {}, T>;
export function focusOn<T>(value: T): DataOptic<T, {}, T>;
export function focusOn<T>(value?: T): DataOptic<T, {}, T> | PureOptic<T, {}, T> {
    if (arguments.length === 0) {
        return new PureOpticImpl([{ get: (s) => s, set: (a) => a }]) as any;
    }
    return new DataOpticImpl(
        [
            {
                get: (s) => s,
                set: (a) => a,
            },
        ],
        value,
    ) as any;
}
