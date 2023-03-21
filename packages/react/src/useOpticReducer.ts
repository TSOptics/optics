import { Dispatch, useCallback } from 'react';
import { pureOptic, PureOptic, OpticType, total, Optic } from '@optix/state';
import { useOptic, UseOpticOptions } from './useOptic';
import { ResolvedType } from '@optix/state/src/Optics/ReadOptic';

type UseOpticReducerOptions = UseOpticOptions;

export const useOpticReducer = <
    T,
    TOpticType extends OpticType,
    Action,
    TOptions extends UseOpticReducerOptions | undefined,
>(
    onState: Optic<T, TOpticType>,
    reducer: (state: T, action: Action, onState: PureOptic<T, total, T>) => T,
    options?: TOptions,
): [ResolvedType<T, TOpticType, TOptions>, Dispatch<Action>] => {
    const [state, setState] = useOptic(onState, options);

    const dispatch = useCallback<Dispatch<Action>>(
        (action: Action) => setState((prev) => reducer(prev, action, pureOptic())),
        [reducer, setState],
    );

    return [state, dispatch];
};
