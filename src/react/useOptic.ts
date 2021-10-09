import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Optic, partial } from '..';
import { rootOpticSymbol, Stores, Store } from '../createStore';
import { OptixStoresContext } from './provider';

function useOptic<T, TLensType extends partial>(optic: Optic<T, TLensType, Stores>) {
    const stores = useContext(OptixStoresContext);

    const storeLens = optic.__getFirst();
    if (storeLens.key !== rootOpticSymbol) {
        throw new Error("This optic isn't linked to a store");
    }

    const [slice, setSlice] = useState(optic.get(stores));

    const store = storeLens.get(stores) as Store;

    const subscription = useCallback(
        (newRoot: any) => {
            setSlice(optic.get(newRoot));
        },
        [optic],
    );
    const subRef = useRef(subscription);

    // synchronize local state with the subscription
    if (subscription !== subRef.current) {
        subscription(store.root);
        store.subscriptions.delete(subRef.current);
        store.subscriptions.add(subscription);
        subRef.current = subscription;
    }

    // register subscription on mount (parent first)
    const mounted = useRef(false);
    if (!mounted.current) {
        store.subscriptions.add(subscription);
        mounted.current = true;
    }
    // unregister subscription on unmount (children first)
    useEffect(
        () => () => {
            store.subscriptions.delete(subRef.current);
        },
        [store.subscriptions],
    );

    const setter = useCallback(
        (value: T | ((prevState: typeof slice) => T)) => {
            const newValue =
                typeof value !== 'function' ? value : (value as (prevState: typeof slice) => T)(optic.get(stores));
            optic.set(newValue, stores);
        },
        [optic, stores],
    );

    return [slice, setter] as [typeof slice, typeof setter];
}

export default useOptic;
