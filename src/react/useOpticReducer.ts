import { Dispatch, useCallback } from 'react';
import { optic } from '../constructors';
import { BaseOptic } from '../BaseOptic';
import { FocusedValue, OpticType, total } from '../types';
import { Optic } from '../Optic';
import useOptic from './useOptic';

const useOpticReducer = <T, TOpticType extends OpticType, Action>(
    onState: Optic<T, TOpticType>,
    reducer: (state: T, action: Action, onState: BaseOptic<T, total, T>) => T,
): [FocusedValue<T, TOpticType>, Dispatch<Action>] => {
    const [state, setState] = useOptic(onState);

    const dispatch = useCallback<Dispatch<Action>>(
        (action: Action) => setState((prev) => reducer(prev, action, optic())),
        [reducer, setState],
    );

    return [state, dispatch];
};

export default useOpticReducer;
