import { useCallback, useContext, useEffect, useRef } from 'react';
import { Lens, Optic, partial } from '../Optic';
import { Store } from '../createStore';
import { OptixStoresContext } from './provider';
import useOptic from './useOptic';
import { opticPartial } from '..';
import { noop } from '../utils';

const useArrayOptic = <T, Completeness extends partial, S>(
    onArray: Optic<T[], Completeness>,
    keyExtractor: (t: T) => string,
) => {
    const [slice, setSlice] = useOptic(onArray);
    const stores = useContext(OptixStoresContext);
    const store = onArray.ˍˍunsafeGetFirstLens().get(stores) as Store;

    const keyExtractorRef = useRef(keyExtractor).current;
    const keyedOptics = useRef<Record<string, Optic<T, Completeness, S>>>({});

    const subscription = useRef<(newRoot: any) => void>(noop);
    subscription.current = (newRoot: any) => {
        const array = onArray.get(newRoot);
        keyedOptics.current =
            array?.reduce<Record<string, Optic<T, Completeness, S>>>((acc, cv, ci) => {
                const key = keyExtractorRef(cv);
                const lensOnIndex: Lens<T, T[]> = {
                    get: (s) => s[ci],
                    set: (a, s) => [...s.slice(0, ci), a, ...s.slice(ci + 1)],
                    key: 'focus ' + ci,
                };
                const previous = keyedOptics.current[key];
                if (previous) {
                    previous.ˍˍunsafeReplaceLast(lensOnIndex);
                    acc[key] = previous;
                } else {
                    acc[key] = onArray.compose(new Optic([lensOnIndex])) as any;
                }
                return acc;
            }, {}) ?? {};
    };

    const opticRef = useRef(opticPartial() as typeof onArray);

    // update optics cache if onArray changed
    if (onArray !== opticRef.current) {
        subscription.current(stores);
        opticRef.current = onArray;
    }

    const mounted = useRef(false);

    // register subscription on mount (parent first)
    if (!mounted.current) {
        store.subscriptions.add(subscription);
        mounted.current = true;
    }

    // unregister subscription on unmount (children first)‡
    useEffect(
        () => () => {
            store.subscriptions.delete(subscription);
        },
        [store.subscriptions],
    );

    const getOpticFromKey = useCallback((key: string) => keyedOptics.current[key], []);

    return [slice, setSlice, getOpticFromKey] as [typeof slice, typeof setSlice, typeof getOpticFromKey];
};

export default useArrayOptic;
