import React, { memo, useCallback, useRef } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import createStore from '../src/react/createStore';
import useOptix from '../src/react/useOptix';
import { act } from 'react-test-renderer';
import { Optix } from '../src/lens';
import useKeyedOptix from '../src/react/useKeyedOptix';
import { render, fireEvent } from '@testing-library/react';

describe('createStore', () => {
    it('should create an optix for each property', () => {
        expect(createStore({ foo: 'foo', bar: 'bar' })).toEqual(
            expect.objectContaining({ onFoo: expect.anything(), onBar: expect.anything() }),
        );
    });
    it('should return only the root optix if not object', () => {
        expect(createStore(42)).toStrictEqual({
            store: expect.anything(),
            wrapper: expect.anything(),
            onRoot: expect.any(Optix),
            setRoot: expect.any(Function),
        });
    });
});
describe('useOptix', () => {
    const initial = { test: 42 };
    const { onRoot, setRoot, wrapper } = createStore(initial);
    beforeEach(() => {
        setRoot(initial);
    });
    it('should set state', () => {
        const { result } = renderHook(() => useOptix(onRoot), { wrapper });
        act(() => result.current[1]((prev) => ({ test: prev.test * 2 })));
        expect(result.current[0]).toStrictEqual({ test: 84 });
    });
    it('should be referentially stable', () => {
        const { result, rerender } = renderHook(() => useOptix(onRoot), {
            wrapper,
        });
        const [prevState, prevSetState] = result.current;
        rerender();
        const [state, setState] = result.current;
        expect(prevState).toBe(state);
        expect(prevSetState).toBe(setState);
    });
});
describe('useKeyedOptix', () => {
    const Number = memo(({ onNumber }: { onNumber: Optix<number> }) => {
        const [n] = useOptix(onNumber);
        const renders = useRef(0);
        renders.current = renders.current + 1;

        return (
            <div data-testid="elems">
                <h1 data-testid="renders">{renders.current}</h1>
                <h1 data-testid="display">{n}</h1>
            </div>
        );
    });

    const Numbers = ({ onArray }: { onArray: Optix<number[]> }) => {
        const [array, setArray, getOptix] = useKeyedOptix(
            onArray,
            useCallback((n) => n.toString(), []),
        );

        const prepend = useCallback(() => {
            setArray((prev) => [prev[0] - 1, ...prev]);
        }, [setArray]);

        const changeSecond = useCallback(() => {
            setArray((prev) => [prev[0], 42, ...prev.slice(2)]);
        }, [setArray]);

        return (
            <div>
                <button onClick={prepend}>prepend</button>
                <button onClick={changeSecond}>changeSecond</button>
                {array.map((n) => {
                    const key = n.toString();
                    return <Number onNumber={getOptix(key)} key={key} />;
                })}
            </div>
        );
    };
    const { onRoot: onArray, wrapper } = createStore([1, 2, 3, 4, 5]);

    it('should not rerender the list elements', () => {
        const { getAllByTestId, getByText } = render(<Numbers onArray={onArray} />, { wrapper });
        const prepend = getByText('prepend');
        fireEvent.click(prepend);
        const elems = getAllByTestId('display');
        const renders = getAllByTestId('renders');
        expect(elems.map((x) => x.textContent)).toStrictEqual(['0', '1', '2', '3', '4', '5']);
        expect(renders.map((x) => x.textContent)).toEqual(['1', '1', '1', '1', '1', '1']);
    });
});
