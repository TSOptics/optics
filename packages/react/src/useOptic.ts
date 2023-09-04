import { Dispatch, SetStateAction, useMemo, useSyncExternalStore } from 'react';
import { OpticType, Optic, GetStateOptions, ResolvedType, ReadOptic } from '@optics/state';

export type UseOpticOptions = GetStateOptions;

export function useOptic<T, TOpticType extends OpticType, TOptions extends UseOpticOptions | undefined>(
    optic: Optic<T, TOpticType>,
    options?: TOptions,
): [ResolvedType<T, TOpticType, TOptions>, Dispatch<SetStateAction<T>>];
export function useOptic<T, TOpticType extends OpticType, TOptions extends UseOpticOptions | undefined>(
    optic: ReadOptic<T, TOpticType>,
    options?: TOptions,
): [ResolvedType<T, TOpticType, TOptions>];
export function useOptic<T, TOpticType extends OpticType, TOptions extends UseOpticOptions | undefined>(
    optic: Optic<T, TOpticType> | ReadOptic<T, TOpticType>,
    options?: TOptions,
) {
    const optionsWithDefault: UseOpticOptions = { denormalize: true, ...(options ?? {}) };
    const slice = useSyncExternalStore(
        (listener) => optic.subscribe(listener),
        () => optic.get(optionsWithDefault as TOptions),
    );

    const setSlice = useMemo(() => (optic as Optic<T, TOpticType>)?.set.bind(optic), [optic]);

    return [slice, setSlice];
}
