import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Optic } from '../Optic';
import { rootOpticSymbol, Stores, Store } from './createStore';
import { OpticsStoresContext } from './provider';
import { noop } from '../utils';
import { OpticType } from '../types';

function useOptic<T, TOpticType extends OpticType>(optic: Optic<T, TOpticType, Stores>) {
    const stores = useContext(OpticsStoresContext);

    const storeLens = optic.ˍˍunsafeGetLenses()[0];
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
        (value: Parameters<typeof optic.set>[0]) => {
            optic.set(value, stores);
        },
        [optic, stores],
    );

    return [slice, setter] as [typeof slice, typeof setter];
}

export default useOptic;
