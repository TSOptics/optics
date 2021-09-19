import { useCallback, useContext, useEffect, useRef } from 'react';
import { Lens, optix, Optix, partial } from '../lens';
import { noop } from '../utils';
import { StoreContext } from './createStore';
import useOptix from './useOptix';

const useKeyedOptix = <T, TLensType extends partial, S>(
    onArray: Optix<T[], TLensType>,
    keyExtractor: (t: T) => string,
) => {
    const [slice, setSlice] = useOptix(onArray);
    const { root, subscriptions } = useContext(StoreContext);

    const keyedOptix = useRef<Record<string, Optix<T, TLensType, S>>>({});

    const subscription = useCallback(
        (newRoot: any) => {
            const array = onArray.get(newRoot);
            keyedOptix.current =
                array?.reduce<Record<string, Optix<T, TLensType, S>>>((acc, cv, ci) => {
                    const key = keyExtractor(cv);
                    const lensOnIndex: Lens<T, T[]> = {
                        get: (s) => s[ci],
                        set: (a, s) => [...s.slice(0, ci), a, ...s.slice(ci + 1)],
                        key: 'focus ' + ci,
                    };
                    const previous = keyedOptix.current[key];
                    if (previous) {
                        previous.__unsafeReplaceLast(lensOnIndex);
                        acc[key] = previous;
                    } else {
                        acc[key] = onArray.compose(optix(lensOnIndex)) as any;
                    }
                    return acc;
                }, {}) ?? {};
        },
        [keyExtractor, onArray],
    );

    const subRef = useRef<typeof subscription>(noop);

    // synchronize optics cache with the subscription
    if (subscription !== subRef.current) {
        subscription(root.ref);
        subRef.current = subscription;
    }

    const mounted = useRef(false);

    // register subscription on mount (parent first)
    if (!mounted.current) {
        subscriptions.add(subRef);
        mounted.current = true;
    }

    // unregister subscription on unmount (children first)‡
    useEffect(
        () => () => {
            subscriptions.delete(subRef);
        },
        [subscriptions],
    );

    const getOptixFromKey = useCallback((key: string) => keyedOptix.current[key], []);

    return [slice, setSlice, getOptixFromKey] as [typeof slice, typeof setSlice, typeof getOptixFromKey];
};

export default useKeyedOptix;
