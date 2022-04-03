import { useCallback, useContext, useEffect, useRef } from 'react';
import { Optic } from '../Optic';
import { Store } from './createStore';
import { OpticsStoresContext } from './provider';
import useOptic from './useOptic';
import { noop } from '../utils';
import { Lens, OpticType } from '../types';

const useArrayOptic = <T, TOpticType extends OpticType, S>(
    onArray: Optic<T[], TOpticType>,
    keyExtractor: (t: T) => string,
) => {
    const [slice, setSlice] = useOptic(onArray);
    const stores = useContext(OpticsStoresContext);
    const store = onArray.ˍˍunsafeGetLenses()[0].get(stores) as Store;

    const keyExtractorRef = useRef(keyExtractor).current;
    const keyedOptics = useRef<Record<string, Optic<T, TOpticType, S>>>({});

    const subscription = useRef<(newRoot: any) => void>(noop);
    subscription.current = (newRoot: any) => {
        const array = onArray.get(newRoot);
        keyedOptics.current =
            (array as T[] | undefined)?.reduce<Record<string, Optic<T, TOpticType, S>>>((acc, cv, ci) => {
                const key = keyExtractorRef(cv);
                const lensOnIndex: Lens<T, T[]> = {
                    get: (s) => s[ci],
                    set: (a, s) => [...s.slice(0, ci), a, ...s.slice(ci + 1)],
                    key: 'focus ' + ci,
                };
                const previous = keyedOptics.current[key];
                if (previous) {
                    const previousLenses = previous.ˍˍunsafeGetLenses();
                    previousLenses[previousLenses.length - 1] = lensOnIndex;
                    acc[key] = previous;
                } else {
                    acc[key] = onArray.compose(new Optic([lensOnIndex])) as any;
                }
                return acc;
            }, {}) ?? {};
    };

    const opticRef = useRef({} as typeof onArray);

    // update optics cache if onArray changed
    if (onArray !== opticRef.current) {
        subscription.current(stores);
        opticRef.current = onArray;
    }

    const unsubscribe = useRef<() => void>();

    // register subscription on mount (parent first)
    /*     if (!unsubscribe.current) {
        unsubscribe.current = store.subscribe(subscription);
    }
 */
    // unregister subscription on unmount (children first)‡
    useEffect(
        () => () => {
            unsubscribe.current?.();
        },
        [],
    );

    const getOpticFromKey = useCallback((key: string) => keyedOptics.current[key], []);

    return [slice, setSlice, getOpticFromKey] as [typeof slice, typeof setSlice, typeof getOpticFromKey];
};

export default useArrayOptic;
