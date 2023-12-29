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
    partial,
} from '@optics/state';

export type UseOpticOptions = GetStateOptions;

export type Setter<T> = {
    setState: Dispatch<SetStateAction<T>>;
};

type SubscriptionResults<TOptic extends ReadOptic<any, OpticScope>> = [
    GetOpticFocus<TOptic>,
    GetOpticScope<TOptic>,
] extends [infer Focus, infer Scope extends OpticScope]
    ? {
          hasValue: <T>(
              success: (optic: Resolve<TOptic, NonNullable<Focus>, Scope extends partial ? total : mapped>) => T,
          ) => T | null;
          guard<T extends FocusedValue<Focus, Scope>>(
              refine: (value: FocusedValue<Focus, Scope>) => false | T,
          ): <U>(success: (optic: Resolve<TOptic, T, Scope extends partial ? total : mapped>) => U) => U | null;
          guard<T extends FocusedValue<Focus, Scope>>(
              typeGuard: (value: FocusedValue<Focus, Scope>) => value is T,
          ): <U>(success: (optic: Resolve<TOptic, T, Scope extends partial ? total : mapped>) => U) => U | null;
      } & (Scope extends mapped
          ? {
                getOpticsFromMapping: (
                    getKey: (t: Focus) => string,
                ) => readonly [key: string, optic: Resolve<TOptic, Focus, total>][];
            }
          : {}) &
          (Focus extends any[]
              ? {
                    getOptics: (
                        getKey: (t: Focus[number]) => string,
                    ) => readonly [key: string, optic: Resolve<TOptic, Focus[number], total>][];
                }
              : {})
    : {};

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

    const hasValue = useCallback(
        (success: (optic: TOptic) => unknown) => (optic.get() !== undefined ? success(optic) : null),
        [optic],
    );

    const guard = (predicate: (value: any) => boolean) => (success: (narrowedOptic: TOptic) => any) =>
        predicate(optic.get()) === false ? null : success(optic);

    return [slice, { setState, getOptics, getOpticsFromMapping, hasValue, guard }];
}
