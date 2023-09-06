import { Dispatch, useCallback } from 'react';
import { pureOptic, PureOptic, OpticScope, total, Optic, ResolvedType } from '@optics/state';
import { useOptic, UseOpticOptions } from './useOptic';

type UseOpticReducerOptions = UseOpticOptions;

export const useOpticReducer = <
    T,
    TScope extends OpticScope,
    Action,
    TOptions extends UseOpticReducerOptions | undefined,
>(
    stateOptic: Optic<T, TScope>,
    reducer: (state: T, action: Action, stateOptic: PureOptic<T, total, T>) => T,
    options?: TOptions,
): [ResolvedType<T, TScope, TOptions>, Dispatch<Action>] => {
    const [state, setState] = useOptic(stateOptic, options);

    const dispatch = useCallback<Dispatch<Action>>(
        (action: Action) => setState((prev) => reducer(prev, action, pureOptic())),
        [reducer, setState],
    );

    return [state, dispatch];
};
