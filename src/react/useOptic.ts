import { Dispatch, SetStateAction, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim/';
import { FocusedValue, OpticType } from '../types';
import { Denormalize, Optic } from '../Optic';

type UseOpticOptions = {
    denormalize?: boolean;
};

function useOptic<T, TOpticType extends OpticType, S>(
    optic: Optic<T, TOpticType, S>,
    options?: UseOpticOptions,
): [Denormalize<FocusedValue<T, TOpticType>>, Dispatch<SetStateAction<T>>] {
    const { denormalize = true } = options ?? {};
    const slice = useSyncExternalStore(
        (listener) => optic.subscribe(listener),
        () => optic.getState(),
    );

    const setSlice = useMemo(() => optic.setState.bind(optic), []);

    return [slice, setSlice];
}

export default useOptic;
