import { Dispatch, SetStateAction, useCallback, useMemo, useSyncExternalStore } from 'react';
import {
    Optic,
    GetStateOptions,
    FocusedValue,
    mapped,
    opticsFromKey,
    opticsFromKeyMapped,
    Modifiers,
    readOnly,
    ResolvedType,
} from '@optics/state';

export type UseOpticOptions = GetStateOptions;

export type Setter<T> = {
    setState: Dispatch<SetStateAction<T>>;
};

type SubscriptionResults<TFocus, TModifiers extends Modifiers> = {
    whenFocused: <T>(then: (optic: Optic<NonNullable<TFocus>, Omit<TModifiers, 'partial'>>) => T) => T | null;
    whenType<T extends FocusedValue<TFocus, TModifiers>>(
        refine: (value: FocusedValue<TFocus, TModifiers>) => false | T,
    ): <U>(then: (optic: Optic<T, Omit<TModifiers, 'partial'>>) => U) => U | null;
    whenType<T extends FocusedValue<TFocus, TModifiers>>(
        typeGuard: (value: FocusedValue<TFocus, TModifiers>) => value is T,
    ): <U>(then: (optic: Optic<T, Omit<TModifiers, 'partial'>>) => U) => U | null;
} & (Pick<TModifiers, 'map'> extends mapped
    ? {
          getOpticsFromMapping: (
              getKey: (t: TFocus) => string,
          ) => readonly [key: string, optic: Optic<TFocus, Omit<TModifiers, 'partial' | 'map'>>][];
      }
    : {}) &
    (TFocus extends any[]
        ? {
              getOptics: (
                  getKey: (t: TFocus[number]) => string,
              ) => readonly [key: string, optic: Optic<TFocus[number], Omit<TModifiers, 'partial'>>][];
          }
        : {});

export function useOptic<TFocus, TModifiers extends Modifiers>(
    optic: Optic<TFocus, TModifiers>,
): Pick<TModifiers, 'readOnly'> extends readOnly
    ? [FocusedValue<TFocus, TModifiers>, SubscriptionResults<TFocus, TModifiers>]
    : [FocusedValue<TFocus, TModifiers>, Setter<TFocus> & SubscriptionResults<TFocus, TModifiers>];
export function useOptic<TFocus, TModifiers extends Modifiers, TOptions extends UseOpticOptions>(
    optic: Optic<TFocus, TModifiers>,
    options: TOptions,
): Pick<TModifiers, 'readOnly'> extends readOnly
    ? [ResolvedType<TFocus, TModifiers, TOptions>, SubscriptionResults<TFocus, TModifiers>]
    : [ResolvedType<TFocus, TModifiers, TOptions>, Setter<TFocus> & SubscriptionResults<TFocus, TModifiers>];
export function useOptic<TModifiers extends Modifiers>(optic: Optic<any, TModifiers>, options?: UseOpticOptions): any {
    const { denormalize } = { denormalize: false, ...(options ?? {}) };

    const subscribe = useCallback(
        (listener: () => void) => optic.subscribe(listener, { denormalize }),
        [denormalize, optic],
    );

    const getSnapshot = useCallback(() => optic.get({ denormalize }), [denormalize, optic]);

    const slice = useSyncExternalStore(subscribe, getSnapshot);

    const setState = useMemo(() => (optic as Optic<any, Modifiers>)?.set.bind(optic), [optic]);

    const getOptics = useMemo(() => opticsFromKey(optic as any), [optic]);

    const getOpticsFromMapping = useMemo(() => opticsFromKeyMapped(optic as any), [optic]);

    const whenFocused = useCallback(
        (success: (optic: Optic<any, TModifiers>) => unknown) => (optic.get() !== undefined ? success(optic) : null),
        [optic],
    );

    const whenType = (predicate: (value: any) => boolean) => (then: (narrowedOptic: Optic<any, TModifiers>) => any) =>
        predicate(optic.get()) === false ? null : then(optic);

    return [slice, { setState, getOptics, getOpticsFromMapping, whenFocused, whenType }];
}
