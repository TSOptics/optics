import { Dispatch, useCallback } from 'react';
import { optic } from '../constructors';
import { BaseOptic } from '../BaseOptic';
import { FocusedValue, OpticType, total } from '../types';
import { Denormalize, Optic } from '../Optic';
import useOptic, { UseOpticOptions } from './useOptic';

type UseOpticReducerOptions = UseOpticOptions;

const useOpticReducer = <T, TOpticType extends OpticType, Action, TOptions extends UseOpticReducerOptions>(
    onState: Optic<T, TOpticType>,
    reducer: (state: T, action: Action, onState: BaseOptic<T, total, T>) => T,
    options?: TOptions,
): [
    TOptions extends { denormalize: false } ? FocusedValue<T, TOpticType> : Denormalize<FocusedValue<T, TOpticType>>,
    Dispatch<Action>,
] => {
    const [state, setState] = useOptic(onState, options);

    const dispatch = useCallback<Dispatch<Action>>(
        (action: Action) => setState((prev) => reducer(prev, action, optic())),
        [reducer, setState],
    );

    return [state, dispatch];
};

export default useOpticReducer;
