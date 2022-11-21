import { Dispatch, useCallback } from 'react';
import { optic } from '../constructors';
import { BaseOptic } from '../BaseOptic';
import { OpticType, total } from '../types';
import { Optic, ResolvedType } from '../Optic';
import useOptic, { UseOpticOptions } from './useOptic';

type UseOpticReducerOptions = UseOpticOptions;

const useOpticReducer = <T, TOpticType extends OpticType, Action, TOptions extends UseOpticReducerOptions | undefined>(
    onState: Optic<T, TOpticType>,
    reducer: (state: T, action: Action, onState: BaseOptic<T, total, T>) => T,
    options?: TOptions,
): [ResolvedType<T, TOpticType, TOptions>, Dispatch<Action>] => {
    const [state, setState] = useOptic(onState, options);

    const dispatch = useCallback<Dispatch<Action>>(
        (action: Action) => setState((prev) => reducer(prev, action, optic())),
        [reducer, setState],
    );

    return [state, dispatch];
};

export default useOpticReducer;
