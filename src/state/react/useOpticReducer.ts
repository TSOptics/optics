import { Dispatch, useCallback } from 'react';
import { pureOptic } from '../../pureOptic';
import { PureOptic } from '../../PureOptic.types';
import { OpticType, total } from '../../types';
import { Optic, ResolvedType } from '../Optic.types';
import useOptic, { UseOpticOptions } from './useOptic';

type UseOpticReducerOptions = UseOpticOptions;

const useOpticReducer = <T, TOpticType extends OpticType, Action, TOptions extends UseOpticReducerOptions | undefined>(
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

export default useOpticReducer;
