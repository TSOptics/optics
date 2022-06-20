import { Dispatch, useCallback } from 'react';
import { optic } from '../constructors';
import { Optic } from '../Optic';
import { FocusedValue, OpticType, total } from '../types';
import { StoreOptic } from './StoreOptic';
import useOptic from './useOptic';

const useOpticReducer = <T, TOpticType extends OpticType, Action>(
    onState: StoreOptic<T, TOpticType>,
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
