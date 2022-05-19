import { Dispatch, useCallback } from 'react';
import { optic } from '../constructors';
import { Optic } from '../Optic';
import { FocusedValue, OpticType, total } from '../types';
import { Store } from './Store';
import useOptic from './useOptic';

const useOpticReducer = <T, TOpticType extends OpticType, Action>(
    onState: Optic<T, TOpticType, Store>,
    reducer: (state: T, action: Action, onState: Optic<T, total, T>) => T,
): [FocusedValue<T, TOpticType>, Dispatch<Action>] => {
    const [state, setState] = useOptic(onState);

    const dispatch = useCallback<Dispatch<Action>>(
        (action: Action) => setState((prev) => reducer(prev, action, optic())),
        [reducer, setState],
    );

    return [state, dispatch];
};

export default useOpticReducer;
