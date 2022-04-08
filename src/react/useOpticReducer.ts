import { Dispatch, useCallback } from 'react';
import { optic } from '../constructors';
import { Optic } from '../Optic';
import { OpticType, total } from '../types';
import { Stores } from './createStore';
import useOptic from './useOptic';

const useOpticReducer = <T, TOpticType extends OpticType, Action>(
    onState: Optic<T, TOpticType, Stores>,
    reducer: (state: T, action: Action, onState: Optic<T, total, T>) => T,
) => {
    const [state, setState] = useOptic(onState);

    const dispatch = useCallback<Dispatch<Action>>(
        (action: Action) => setState((prev) => reducer(prev, action, optic())),
        [reducer, setState],
    );

    return [state, dispatch] as [typeof state, typeof dispatch];
};

export default useOpticReducer;
