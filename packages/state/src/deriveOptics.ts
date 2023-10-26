import { Lens, ReduceValue, mapped, partial } from '@optics/core';
import { ReadOptic } from './Optics/ReadOptic';
import { GetOpticFocus, GetOpticScope, Resolve } from './types';

const focusIndex = (index: number): Lens<any, any[]> => ({
    get: (s) => s[index],
    set: (a, s) => [...s.slice(0, index), a, ...s.slice(index + 1)],
    key: 'focus index ' + index,
});

const reduceIndex = (index: number) => ({
    get: (s: ReduceValue[]) => s[index],
    type: 'fold',
    key: 'reduce index ' + index,
});

export const deriveOptics = <TOptic extends ReadOptic<T, partial>, T extends any[] = GetOpticFocus<TOptic>>({
    getKey,
    optic,
}: {
    optic: TOptic;
    getKey: (t: T) => string;
}): ReadOptic<[key: string, optic: Resolve<TOptic, T[number], partial>][], GetOpticScope<TOptic>> => {
    let cachedOptics: Record<string, ReadOptic<any, partial>> = {};

    const derived = optic.derive({
        get: (s) => {
            const derivedOptics = s.reduce<[key: string, optic: ReadOptic<any, partial>][]>((acc, cv, ci) => {
                const key = getKey(cv);
                const cachedOptic = cachedOptics[key];
                if (cachedOptic) {
                    const lenses = (cachedOptic as any).lenses;
                    lenses[lenses.length - 1] = focusIndex(ci);
                    acc.push([key, cachedOptic]);
                } else {
                    acc.push([key, optic[ci]]);
                }

                return acc;
            }, []);

            cachedOptics = Object.fromEntries(derivedOptics);

            return derivedOptics;
        },
    });

    return derived as any;
};

export const deriveOpticsMapped = <TOptic extends ReadOptic<T, mapped>, T = GetOpticFocus<TOptic>>({
    getKey,
    optic,
}: {
    optic: TOptic;
    getKey: (t: T) => string;
}): ReadOptic<[key: string, optic: Resolve<TOptic, T, partial>][], partial> => {
    let cachedOptics: Record<string, ReadOptic<any, partial>> = {};

    const derived = optic.reduce((values) => {
        const derivedOptics = values.reduce<[key: string, optic: ReadOptic<any, partial>][]>((acc, cv, ci) => {
            const key = getKey(cv.value);
            const cachedOptic = cachedOptics[key];
            if (cachedOptic) {
                const lenses = (cachedOptic as any).lenses;
                lenses[lenses.length - 1] = reduceIndex(ci);
                acc.push([key, cachedOptic]);
            } else {
                acc.push([key, optic.reduce((values) => values[ci])]);
            }

            return acc;
        }, []);

        cachedOptics = Object.fromEntries(derivedOptics);

        return { value: derivedOptics } as ReduceValue;
    });

    return derived as any;
};
