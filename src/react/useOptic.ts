import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
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

    const previousOptic = useRef(optic);

    // update local state if optic changed
    if (previousOptic.current !== optic) {
        subscription.current(stores);
        previousOptic.current = optic;
    }

    // register subscription on mount (parent first)
    const unsubscribe = useRef<() => void>();
    if (!unsubscribe.current) {
        unsubscribe.current = store.subscribe(subscription);
    }
    // unregister subscription on unmount (children first)
    useEffect(
        () => () => {
            unsubscribe.current?.();
        },
        [],
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
