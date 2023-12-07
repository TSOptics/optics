import { Dispatch, SetStateAction, useCallback, useMemo, useSyncExternalStore } from 'react';
import {
    OpticScope,
    Optic,
    GetStateOptions,
    ResolvedType,
    ReadOptic,
    GetOpticFocus,
    GetOpticScope,
    FocusedValue,
} from '@optics/state';

export type UseOpticOptions = GetStateOptions;

export function useOptic<TOptic extends ReadOptic<any, OpticScope>>(
    optic: TOptic,
): [GetOpticFocus<TOptic>, GetOpticScope<TOptic>] extends [infer TFocus, infer TScope extends OpticScope]
    ? ReadOptic<TFocus, TScope> extends TOptic
        ? [FocusedValue<TFocus, TScope>]
        : [FocusedValue<TFocus, TScope>, Dispatch<SetStateAction<TFocus>>]
    : never;
export function useOptic<TOptic extends ReadOptic<any, OpticScope>, TOptions extends UseOpticOptions>(
    optic: TOptic,
    options: TOptions,
): [GetOpticFocus<TOptic>, GetOpticScope<TOptic>] extends [infer TFocus, infer TScope extends OpticScope]
    ? ReadOptic<TFocus, TScope> extends TOptic
        ? [ResolvedType<TFocus, TScope, TOptions>]
        : [ResolvedType<TFocus, TScope, TOptions>, Dispatch<SetStateAction<TFocus>>]
    : never;
export function useOptic<TOptic extends ReadOptic<any, OpticScope>>(optic: TOptic, options?: UseOpticOptions) {
    const { denormalize } = { denormalize: false, ...(options ?? {}) };

    const subscribe = useCallback(
        (listener: () => void) => optic.subscribe(listener, { denormalize }),
        [denormalize, optic],
    );

    const getSnapshot = useCallback(() => optic.get({ denormalize }), [denormalize, optic]);

    const slice = useSyncExternalStore(subscribe, getSnapshot);

    const setSlice = useMemo(() => (optic as Optic<any, OpticScope>)?.set.bind(optic), [optic]);

    return [slice, setSlice];
}
