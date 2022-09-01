import { Dispatch, SetStateAction, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim/';
import { FocusedValue, OpticType } from '../types';
import { Optic } from '../Optic';

function useOptic<T, TOpticType extends OpticType, S>(
    optic: Optic<T, TOpticType, S>,
): [FocusedValue<T, TOpticType>, Dispatch<SetStateAction<T>>] {
    const slice = useSyncExternalStore(
        (listener) => optic.subscribe(listener),
        () => optic.getState(),
    );

    const setSlice = useMemo(() => optic.setState.bind(optic), []);

    return [slice, setSlice];
}

export default useOptic;
