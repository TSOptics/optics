import { Dispatch, SetStateAction, useCallback, useMemo, useSyncExternalStore } from 'react';
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
    const { denormalize }: UseOpticOptions = { denormalize: false, ...(options ?? {}) };

    const subscribe = useCallback(
        (listener: () => void) => optic.subscribe(listener, { denormalize }),
        [denormalize, optic],
    );

    const getSnapshot = useCallback(() => optic.get({ denormalize }), [denormalize, optic]);

    const slice = useSyncExternalStore(subscribe, getSnapshot);

    const setSlice = useMemo(() => (optic as Optic<T, TScope>)?.set.bind(optic), [optic]);

    return [slice, setSlice];
}
