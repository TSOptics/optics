import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Optic, partial } from '../Optic';
import { rootOpticSymbol, Stores, Store } from '../createStore';
import { OptixStoresContext } from './provider';
import { noop } from '../utils';

function useOptic<T, Completeness extends partial>(optic: Optic<T, Completeness, Stores>) {
    const stores = useContext(OptixStoresContext);

    const storeLens = optic.ˍˍunsafeGetFirstLens();
    if (storeLens.key !== rootOpticSymbol) {
        throw new Error("This optic isn't linked to a store");
    }

    const [slice, setSlice] = useState(optic.get(stores));

    const store = storeLens.get(stores) as Store;

    const subscription = useRef<(newRoot: any) => void>(noop);
    subscription.current = (newRoot: any) => {
        const value = optic.get(newRoot);
        if (value === slice) return;
        setSlice(value);
    };

    const opticRef = useRef(optic);

    // update local state if optic changed
    if (opticRef.current !== optic) {
        subscription.current(stores);
        opticRef.current = optic;
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
            store.subscriptions.delete(subscription);
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
