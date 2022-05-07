import { useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim/';
import { Optic } from '../Optic';
import { rootOpticSymbol, Stores, Store } from './createStore';
import { Lens, OpticType } from '../types';
import stores from './stores';

function useOptic<T, TOpticType extends OpticType>(optic: Optic<T, TOpticType, Stores>) {
    const storeLens: Lens<Store, Stores> = optic.ˍˍunsafeGetLenses()[0];
    if (storeLens.key !== rootOpticSymbol) {
        throw new Error("This optic isn't linked to a store");
    }

    const store = storeLens.get(stores);

    const slice = useSyncExternalStore(store.subscribe, () => optic.get(stores));

    const setter = useCallback(
        (value: Parameters<typeof optic.set>[0]) => {
            optic.set(value, stores);
        },
        [optic],
    );

    return [slice, setter] as [typeof slice, typeof setter];
}

export default useOptic;
