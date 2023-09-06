import { GetOpticFocus, GetOpticScope, Lens, OpticScope, ReadOptic, Resolve } from '@optics/state';
import { useOptic } from './useOptic';
import { useRef } from 'react';

const focusIndex = (index: number): Lens<any, any[]> => ({
    get: (s) => s[index],
    set: (a, s) => [...s.slice(0, index), a, ...s.slice(index + 1)],
    key: 'focus ' + index,
});

export function useDeriveOptics<
    TOptic extends ReadOptic<any[], any>,
    T extends any[] = GetOpticFocus<TOptic>,
    TScope extends OpticScope = GetOpticScope<TOptic>,
>(arrayOptic: TOptic, getKey: (t: T[number]) => string): [key: string, optic: Resolve<TOptic, T[number], TScope>][] {
    const [array = []] = useOptic(arrayOptic, { denormalize: false });

    const cachedOptics = useRef<Record<string, Resolve<TOptic, T[number], TScope>>>({});

    const derivedOptics = array.reduce<(typeof cachedOptics)['current']>((acc, cv, ci) => {
        const key = getKey(cv);
        const cachedOptic = cachedOptics.current[key];
        if (cachedOptic) {
            const lenses = (cachedOptic as any).lenses;
            lenses[lenses.length - 1] = focusIndex(ci);
        }

        acc[key] = cachedOptic ?? (arrayOptic as any)[ci];
        return acc;
    }, {});

    cachedOptics.current = derivedOptics;

    return Object.entries(derivedOptics);
}
