import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-test-renderer';
import { render } from '@testing-library/react';
import { useOptic } from './useOptic';
import { useOpticReducer } from './useOpticReducer';
import { pureOptic, PureOptic, Optic, total, createState, ReadOptic } from '@optics/state';

describe('useOptic', () => {
    it('should set state', () => {
        const rootOptic = createState({ test: 42 });
        const { result } = renderHook(() => useOptic(rootOptic));
        act(() => result.current[1]((prev) => ({ test: prev.test * 2 })));
        expect(result.current[0]).toStrictEqual({ test: 84 });
    });
    it('should return referentially stable state and setter', () => {
        const rootOptic = createState({ test: 42 });
        const { result, rerender } = renderHook(() => useOptic(rootOptic));
        const [prevState, prevSetState] = result.current;
        rerender();
        const [state, setState] = result.current;
        expect(prevState).toBe(state);
        expect(prevSetState).toBe(setState);
    });
    it('should not rerender when calling setter with the same reference', () => {
        const rootOptic = createState({ test: 42 });
        const { result } = renderHook(() => useOptic(rootOptic));
        const initialResult = result.current;
        act(() => initialResult[1]((prev) => prev));
        expect(result.current).toBe(initialResult);
    });

    it("shouldn't accept pure optics", () => {
        const onA: PureOptic<any> = pureOptic<{ a: string }>().a;
        // @ts-expect-error
        () => renderHook(() => useOptic(onA));
    });
    it('should update state if optic changes', () => {
        const rootOptic = createState({ test: 42 });
        const timesTwo = rootOptic.derive({
            get: (a) => ({
                test: a.test * 2,
            }),
            set: (b) => ({
                test: b.test / 2,
            }),
        });
        const { result, rerender } = renderHook(
            ({ initialValue }: { initialValue: typeof rootOptic }) => useOptic(initialValue),
            {
                initialProps: { initialValue: rootOptic },
            },
        );
        rerender({ initialValue: timesTwo });
        expect(result.current[0]).toEqual({ test: 84 });
    });
    it('should not exhibit the zombie child problem', async () => {
        const stateOptic = createState<number[]>([42]);
        const firstOptic = stateOptic[0];

        const Children = ({ elemOptic }: { elemOptic: Optic<number> }) => {
            const [elem] = useOptic(elemOptic);
            return <>{elem.toString()}</>;
        };
        const Parent = () => {
            const [state] = useOptic(stateOptic);
            return <>{state.length > 0 ? <Children elemOptic={firstOptic} /> : null}</>;
        };

        render(<Parent />);
        await act(() => stateOptic.set([]));
    });
    it("shouldn't return a setter when passed a ReadOptic", () => {
        const readOptic: ReadOptic<number> = createState(42);
        const { result } = renderHook(() => useOptic(readOptic));
        const _: [number] = result.current;
    });
});

describe('useOpticReducer', () => {
    type State = { counter: number; step: number };
    type Action =
        | { type: 'increment' }
        | { type: 'decrement' }
        | { type: 'changeStep'; step: number }
        | { type: 'reset' };
    const initialValue: State = { counter: 0, step: 1 };
    const stateOptic = createState(initialValue);
    const reducer = (state: State, action: Action): State => {
        switch (action.type) {
            case 'increment':
                return { ...state, counter: state.counter + state.step };
            case 'decrement':
                return { ...state, counter: state.counter - state.step };
            case 'changeStep':
                return { ...state, step: action.step };
            case 'reset':
                return initialValue;
        }
    };
    const reducerWithOptic = (state: State, action: Action, stateOptic: PureOptic<State, total, State>): State => {
        const counterOptic = stateOptic.counter;
        const stepOptic = stateOptic.step;
        switch (action.type) {
            case 'increment':
                return counterOptic.set((prev) => prev + state.step, state);
            case 'decrement':
                return counterOptic.set((prev) => prev - state.step, state);
            case 'changeStep':
                return stepOptic.set(action.step, state);
            case 'reset':
                return initialValue;
        }
    };
    it('should dispatch actions', () => {
        const { result, rerender } = renderHook(({ initialReducer }) => useOpticReducer(stateOptic, initialReducer), {
            initialProps: { initialReducer: reducer as typeof reducerWithOptic },
        });
        const dispatchActions = () => {
            result.current[1]({ type: 'increment' });
            result.current[1]({ type: 'increment' });
            result.current[1]({ type: 'changeStep', step: 20 });
            result.current[1]({ type: 'increment' });
            result.current[1]({ type: 'changeStep', step: 5 });
            result.current[1]({ type: 'decrement' });
        };
        act(dispatchActions);
        expect(result.current[0]).toEqual({ counter: 17, step: 5 });

        act(() => result.current[1]({ type: 'reset' }));
        rerender({ initialReducer: reducerWithOptic });
        expect(result.current[0]).toEqual({ counter: 0, step: 1 });

        act(dispatchActions);
        expect(result.current[0]).toEqual({ counter: 17, step: 5 });
    });
});
