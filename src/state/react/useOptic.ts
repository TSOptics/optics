import { Dispatch, SetStateAction, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim/';
import { GetStateOptions, OpticType } from '../../types';
import { Optic, ResolvedType } from '../Optic.types';

export type UseOpticOptions = GetStateOptions;

function useOptic<T, TOpticType extends OpticType, S, TOptions extends UseOpticOptions | undefined>(
    optic: Optic<T, TOpticType, S>,
    options?: TOptions,
): [ResolvedType<T, TOpticType, TOptions>, Dispatch<SetStateAction<T>>] {
    const optionsWithDefault: UseOpticOptions = { denormalize: true, ...(options ?? {}) };
    const slice = useSyncExternalStore(
        (listener) => optic.subscribe(listener),
        () => optic.get(optionsWithDefault as TOptions),
    );

    const setSlice = useMemo(() => optic.set.bind(optic), []);

    return [slice, setSlice];
}

export default useOptic;
