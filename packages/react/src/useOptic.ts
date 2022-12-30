import { Dispatch, SetStateAction, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim/';
import { OpticType, GetStateOptions, Optic, ResolvedType } from '@optix/state';

export type UseOpticOptions = GetStateOptions;

export function useOptic<T, TOpticType extends OpticType, S, TOptions extends UseOpticOptions | undefined>(
    optic: Optic<T, TOpticType, S>,
    options?: TOptions,
): [ResolvedType<T, TOpticType, TOptions>, Dispatch<SetStateAction<T>>] {
    const optionsWithDefault: UseOpticOptions = { denormalize: true, ...(options ?? {}) };
    const slice = useSyncExternalStore(
        (listener) => optic.subscribe(listener),
        () => optic.get(optionsWithDefault as TOptions),
    );

    const setSlice = useMemo(() => optic.set.bind(optic), [optic]);

    return [slice, setSlice];
}
