import { ReduceValue, mapped, partial } from '@optics/core';
import { Modifiers } from './types';
import { Optic } from './Optics/Optic';

export const opticsFromKey = <T extends any[], TModifiers extends Modifiers>(
    optic: Optic<T, TModifiers>,
): ((getKey: (t: T[number]) => string) => readonly [key: string, optic: Optic<T[number], TModifiers & partial>][]) => {
    let cache: Record<string, Optic<any, partial>> = {};

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

export const opticsFromKeyMapped = <T, TModifiers extends Modifiers & mapped>(
    optic: Optic<T, TModifiers>,
): ((getKey: (t: T) => string) => (readonly [key: string, optic: Optic<T, Omit<TModifiers, 'map'> & partial>])[]) => {
    let cache: Record<string, Optic<T, partial>> = {};

    return (getKey) => {
        let elemByKey: Record<string, ReduceValue<T>>;
        const mappedOptic = (optic as Optic<T, mapped>).reduce((s) => {
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
