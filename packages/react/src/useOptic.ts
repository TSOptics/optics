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
    Resolve,
    total,
    mapped,
    opticsFromKey,
    opticsFromKeyMapped,
} from '@optics/state';

export type UseOpticOptions = GetStateOptions;

export type Setter<T> = {
    setState: Dispatch<SetStateAction<T>>;
};

type GetOptics<TOptic extends ReadOptic<any, OpticScope>> = GetOpticFocus<TOptic> extends infer T extends any[]
    ? {
          getOptics: (
              getKey: (t: T[number]) => string,
          ) => readonly [key: string, optic: Resolve<TOptic, T[number], total>][];
      }
    : {};

type GetOpticsFromMapping<TOptic extends ReadOptic<any, OpticScope>> = [
    GetOpticFocus<TOptic>,
    GetOpticScope<TOptic>,
] extends [infer T, mapped]
    ? {
          getOpticsFromMapping: (
              getKey: (t: T) => string,
          ) => readonly [key: string, optic: Resolve<TOptic, T, total>][];
      }
    : {};

type SubscriptionResults<TOptic extends ReadOptic<any, OpticScope>> = GetOptics<TOptic> & GetOpticsFromMapping<TOptic>;

export function useOptic<TOptic extends ReadOptic<any, OpticScope>>(
    optic: TOptic,
): [GetOpticFocus<TOptic>, GetOpticScope<TOptic>] extends [infer TFocus, infer TScope extends OpticScope]
    ? AsyncReadOptic<TFocus, TScope> extends TOptic
        ? [FocusedValue<TFocus, TScope>, SubscriptionResults<TOptic>]
        : [FocusedValue<TFocus, TScope>, Setter<TFocus> & SubscriptionResults<TOptic>]
    : never;
export function useOptic<TOptic extends ReadOptic<any, OpticScope>, TOptions extends UseOpticOptions>(
    optic: TOptic,
    options: TOptions,
): [GetOpticFocus<TOptic>, GetOpticScope<TOptic>] extends [infer TFocus, infer TScope extends OpticScope]
    ? AsyncReadOptic<TFocus, TScope> extends TOptic
        ? [ResolvedType<TFocus, TScope, TOptions>, SubscriptionResults<TOptic>]
        : [ResolvedType<TFocus, TScope, TOptions>, Setter<TFocus> & SubscriptionResults<TOptic>]
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

    const getOptics = useMemo(() => opticsFromKey(optic as any), [optic]);

    const getOpticsFromMapping = useMemo(() => opticsFromKeyMapped(optic as any), [optic]);

    return [slice, { setState, getOptics, getOpticsFromMapping }];
}
