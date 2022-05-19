import { Dispatch, SetStateAction, useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim/';
import { Optic } from '../Optic';
import { getStore, Store, subscribe, setStore } from './Store';
import { FocusedValue, OpticType } from '../types';

function useOptic<T, TOpticType extends OpticType>(
    optic: Optic<T, TOpticType, Store>,
): [FocusedValue<T, TOpticType>, Dispatch<SetStateAction<T>>] {
    const slice = useSyncExternalStore(
        (listener) => subscribe(optic, listener),
        () => optic.get(getStore(optic)),
    );

    const setter = useCallback(
        (value: Parameters<typeof optic.set>[0]) => {
            const store = getStore(optic);
            const newStore = optic.set(value, store);
            setStore(newStore);
        },
        [optic],
    );

    return [slice, setter];
}

export default useOptic;
