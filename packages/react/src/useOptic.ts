import { Dispatch, SetStateAction, useMemo, useSyncExternalStore } from 'react';
import { OpticScope, Optic, GetStateOptions, ResolvedType, ReadOptic } from '@optics/state';

export type UseOpticOptions = GetStateOptions;

export function useOptic<T, TScope extends OpticScope, TOptions extends UseOpticOptions | undefined>(
    optic: Optic<T, TScope>,
    options?: TOptions,
): [ResolvedType<T, TScope, TOptions>, Dispatch<SetStateAction<T>>];
export function useOptic<T, TScope extends OpticScope, TOptions extends UseOpticOptions | undefined>(
    optic: ReadOptic<T, TScope>,
    options?: TOptions,
): [ResolvedType<T, TScope, TOptions>];
export function useOptic<T, TScope extends OpticScope, TOptions extends UseOpticOptions | undefined>(
    optic: Optic<T, TScope> | ReadOptic<T, TScope>,
    options?: TOptions,
) {
    const optionsWithDefault: UseOpticOptions = { denormalize: true, ...(options ?? {}) };
    const slice = useSyncExternalStore(
        (listener) => optic.subscribe(listener),
        () => optic.get(optionsWithDefault as TOptions),
    );

    const setSlice = useMemo(() => (optic as Optic<T, TScope>)?.set.bind(optic), [optic]);

    return [slice, setSlice];
}
