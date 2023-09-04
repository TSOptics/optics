import { Lens, Optic, partial } from '@optics/state';
import { useOptic } from './useOptic';
import { useRef } from 'react';

const focusIndex = (index: number): Lens<any, any[]> => ({
    get: (s) => s[index],
    set: (a, s) => [...s.slice(0, index), a, ...s.slice(index + 1)],
    key: 'focus ' + index,
});

export function useDeriveOptics<T, TScope extends partial>(
    onArray: Optic<T[], TScope>,
    getKey: (t: T) => string,
): [key: string, optic: Optic<T, TScope>][] {
    const [array = []] = useOptic(onArray, { denormalize: false });

    const cachedOptics = useRef<Record<string, Optic<T, TScope>>>({});

    const derivedOptics = array.reduce<(typeof cachedOptics)['current']>((acc, cv, ci) => {
        const key = getKey(cv);
        const cachedOptic = cachedOptics.current[key];
        if (cachedOptic) {
            const lenses = (cachedOptic as any).lenses;
            lenses[lenses.length - 1] = focusIndex(ci);
        }

        acc[key] = cachedOptic ?? (onArray as any)[ci];
        return acc;
    }, {});

    cachedOptics.current = derivedOptics;

    return Object.entries(derivedOptics);
}
