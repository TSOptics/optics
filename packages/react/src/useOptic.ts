import { Dispatch, SetStateAction, useMemo, useSyncExternalStore } from 'react';
import { OpticType, Optic, GetStateOptions, ResolvedType } from '@optics/state';

export type UseOpticOptions = GetStateOptions;

export function useOptic<T, TOpticType extends OpticType, TOptions extends UseOpticOptions | undefined>(
    optic: Optic<T, TOpticType>,
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
