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
    AsyncReadOptic,
} from '@optics/state';

export type UseOpticOptions = GetStateOptions;

export type Setter<T> = {
    setState: Dispatch<SetStateAction<T>>;
};

export function useOptic<TOptic extends ReadOptic<any, OpticScope>>(
    optic: TOptic,
): [GetOpticFocus<TOptic>, GetOpticScope<TOptic>] extends [infer TFocus, infer TScope extends OpticScope]
    ? AsyncReadOptic<TFocus, TScope> extends TOptic
        ? [FocusedValue<TFocus, TScope>]
        : [FocusedValue<TFocus, TScope>, Setter<TFocus>]
    : never;
export function useOptic<TOptic extends ReadOptic<any, OpticScope>, TOptions extends UseOpticOptions>(
    optic: TOptic,
    options: TOptions,
): [GetOpticFocus<TOptic>, GetOpticScope<TOptic>] extends [infer TFocus, infer TScope extends OpticScope]
    ? AsyncReadOptic<TFocus, TScope> extends TOptic
        ? [ResolvedType<TFocus, TScope, TOptions>]
        : [ResolvedType<TFocus, TScope, TOptions>, Setter<TFocus>]
    : never;
export function useOptic<TOptic extends ReadOptic<any, OpticScope>>(optic: TOptic, options?: UseOpticOptions) {
    const { denormalize } = { denormalize: false, ...(options ?? {}) };

    const subscribe = useCallback(
        (listener: () => void) => optic.subscribe(listener, { denormalize }),
        [denormalize, optic],
    );

    const getSnapshot = useCallback(() => optic.get({ denormalize }), [denormalize, optic]);

    const slice = useSyncExternalStore(subscribe, getSnapshot);

    const setState = useMemo(() => (optic as Optic<any, OpticScope>)?.set.bind(optic), [optic]);

    return [slice, { setState }];
}
