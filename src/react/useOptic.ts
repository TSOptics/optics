import { Dispatch, SetStateAction, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim/';
import { FocusedValue, GetStateOptions, OpticType } from '../types';
import { Denormalize, Optic } from '../Optic';

export type UseOpticOptions = GetStateOptions;

function useOptic<T, TOpticType extends OpticType, S, TOptions extends UseOpticOptions>(
    optic: Optic<T, TOpticType, S>,
    options?: TOptions,
): [
    TOptions extends { denormalize: false } ? FocusedValue<T, TOpticType> : Denormalize<FocusedValue<T, TOpticType>>,
    Dispatch<SetStateAction<T>>,
] {
    const optionsWithDefault: UseOpticOptions = { denormalize: true, ...(options ?? {}) };
    const slice = useSyncExternalStore(
        (listener) => optic.subscribe(listener),
        () => optic.getState(optionsWithDefault as TOptions),
    );

    const setSlice = useMemo(() => optic.setState.bind(optic), []);

    return [slice, setSlice];
}

export default useOptic;
