import { useCallback, useContext, useEffect, useRef } from 'react';
import { Lens, Optic, partial } from '../Optic';
import { noop } from '../utils';
import { Store } from '../createStore';
import { OptixStoresContext } from './provider';
import useOptic from './useOptic';

const useArrayOptic = <T, TLensType extends partial, S>(
    onArray: Optic<T[], TLensType>,
    keyExtractor: (t: T) => string,
) => {
    const [slice, setSlice] = useOptic(onArray);
    const stores = useContext(OptixStoresContext);
    const store = onArray.__getFirst().get(stores) as Store;

    const keyedOptics = useRef<Record<string, Optic<T, TLensType, S>>>({});

    const subscription = useCallback(
        (newRoot: any) => {
            const array = onArray.get(newRoot);
            keyedOptics.current =
                array?.reduce<Record<string, Optic<T, TLensType, S>>>((acc, cv, ci) => {
                    const key = keyExtractor(cv);
                    const lensOnIndex: Lens<T, T[]> = {
                        get: (s) => s[ci],
                        set: (a, s) => [...s.slice(0, ci), a, ...s.slice(ci + 1)],
                        key: 'focus ' + ci,
                    };
                    const previous = keyedOptics.current[key];
                    if (previous) {
                        previous.__unsafeReplaceLast(lensOnIndex);
                        acc[key] = previous;
                    } else {
                        acc[key] = onArray.compose(new Optic([lensOnIndex])) as any;
                    }
                    return acc;
                }, {}) ?? {};
        },
        [keyExtractor, onArray],
    );

    const subRef = useRef<typeof subscription>(noop);

    // synchronize optics cache with the subscription
    if (subscription !== subRef.current) {
        subscription(stores);
        store.subscriptions.delete(subRef.current);
        store.subscriptions.add(subscription);
        subRef.current = subscription;
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
            store.subscriptions.delete(subRef.current);
        },
        [store.subscriptions],
    );

    const getOpticFromKey = useCallback((key: string) => keyedOptics.current[key], []);

    return [slice, setSlice, getOpticFromKey] as [typeof slice, typeof setSlice, typeof getOpticFromKey];
};

export default useArrayOptic;
