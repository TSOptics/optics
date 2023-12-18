import { ReduceValue, mapped, partial } from '@optics/core';
import { ReadOptic } from './Optics/ReadOptic';
import { GetOpticFocus, Resolve } from './types';

export const opticsFromKey = <TOptic extends ReadOptic<T, partial>, T extends any[] = GetOpticFocus<TOptic>>(
    optic: TOptic,
): ((getKey: (t: T[number]) => string) => readonly [key: string, optic: Resolve<TOptic, T[number], partial>][]) => {
    let cache: Record<string, ReadOptic<any, partial>> = {};

    return (getKey) => {
        let previousS: T;
        let elemByKey: Record<string, T[number]>;

        const array: T[] = (optic as any).get({ denormalize: false }) ?? [];
        const optics = array.map((elem) => {
            const key = getKey(elem);
            const cachedOptic = cache[key];
            if (cachedOptic) {
                return [key, cachedOptic] as const;
            }
            const opticOnKey = optic.derive({
                get: (s) => {
                    if (!previousS || !elemByKey || s !== previousS) {
                        elemByKey = Object.fromEntries(s.map((elem) => [getKey(elem), elem]));
                        previousS = s;
                    }

                    return elemByKey[key];
                },
                set: (a, s) => {
                    return s.map((elem) => (getKey(elem) === key ? a : elem)) as T;
                },
            });
            return [key, opticOnKey] as const;
        });
        cache = Object.fromEntries(optics);
        return optics as any;
    };
};

export const opticsFromKeyMapped = <TOptic extends ReadOptic<T, mapped>, T = GetOpticFocus<TOptic>>(
    optic: TOptic,
): ((getKey: (t: T) => string) => (readonly [key: string, optic: Resolve<TOptic, T, partial>])[]) => {
    let cache: Record<string, ReadOptic<T, partial>> = {};

    return (getKey) => {
        let elemByKey: Record<string, ReduceValue<T>>;
        const mappedOptic = optic.reduce((s) => {
            elemByKey = Object.fromEntries(s.map((elem) => [getKey(elem.value), elem]));
            return s;
        });

        const array: T[] = (optic as any).get({ denormalize: false }) ?? [];
        const optics = array.map((elem) => {
            const key = getKey(elem);
            const cachedOptic = cache[key];
            if (cachedOptic) {
                return [key, cachedOptic] as const;
            }
            const opticOnKey = mappedOptic.reduce(() => elemByKey[key]);
            return [key, opticOnKey] as const;
        });
        cache = Object.fromEntries(optics);
        return optics as any;
    };
};
