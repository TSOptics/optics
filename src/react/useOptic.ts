import { useCallback, useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { Optic } from '../Optic';
import { rootOpticSymbol, Stores, Store } from './createStore';
import { OpticsStoresContext } from './provider';
import { OpticType } from '../types';

function useOptic<T, TOpticType extends OpticType>(optic: Optic<T, TOpticType, Stores>) {
    const stores = useContext(OpticsStoresContext);

    const storeLens = optic.ˍˍunsafeGetLenses()[0];
    if (storeLens.key !== rootOpticSymbol) {
        throw new Error("This optic isn't linked to a store");
    }

    const store = storeLens.get(stores) as Store;

    const slice = useSyncExternalStore(
        store.subscribe,
        useCallback(() => optic.get(stores), [optic, stores]),
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
