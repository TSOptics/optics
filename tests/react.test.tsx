import React, { memo, useCallback, useRef } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import createStore from '../src/react/createStore';
import { act } from 'react-test-renderer';
import { Optic } from '../src/Optic';
import useArrayOptic from '../src/react/useArrayOptic';
import { render, fireEvent } from '@testing-library/react';
import useOptic from '../src/react/useOptic';
import Provider from '../src/react/provider';
import { total } from '../src/types';
import { optic } from '../src/constructors';

describe('useOptic', () => {
    it('should set state', () => {
        const onRoot = createStore({ test: 42 });
        const { result } = renderHook(() => useOptic(onRoot), { wrapper: Provider });
        act(() => result.current[1]((prev) => ({ test: prev.test * 2 })));
        expect(result.current[0]).toStrictEqual({ test: 84 });
    });
    it('should be referentially stable', () => {
        const onRoot = createStore({ test: 42 });
        const { result, rerender } = renderHook(() => useOptic(onRoot), {
            wrapper: Provider,
        });
        const [prevState, prevSetState] = result.current;
        rerender();
        const [state, setState] = result.current;
        expect(prevState).toBe(state);
        expect(prevSetState).toBe(setState);
    });

    it('should only accept optics with the stores as root', () => {
        const onA: Optic<string, total, any> = optic<{ a: string }>().focus('a');
        const {
            result: { error },
        } = renderHook(() => useOptic(onA), { wrapper: Provider });
        expect(error?.message).toBe("This optic isn't linked to a store");
    });
    it('should update state if optic changes', () => {
        const onRoot = createStore({ test: 42 });
        const timesTwo = onRoot.convert(
            (a) => ({
                test: a.test * 2,
            }),
            (b) => ({
                test: b.test / 2,
            }),
        );
        const { result, rerender } = renderHook(
            ({ initialValue }: { initialValue: typeof onRoot }) => useOptic(initialValue),
            {
                wrapper: Provider,
                initialProps: { initialValue: onRoot },
            },
        );
        rerender({ initialValue: timesTwo });
        expect(result.current[0]).toEqual({ test: 84 });
    });
});
describe('useArrayOptic', () => {
    const Number = memo(({ onNumber }: { onNumber: Optic<number> }) => {
        const [n] = useOptic(onNumber);
        const renders = useRef(0);
        renders.current = renders.current + 1;

        return (
            <div data-testid="elems">
                <h1 data-testid="renders">{renders.current}</h1>
                <h1 data-testid="display">{n}</h1>
            </div>
        );
    });

    const Numbers = ({ onArray }: { onArray: Optic<number[]> }) => {
        const [array, setArray, getOptic] = useArrayOptic(
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
                    return <Number onNumber={getOptic(key)} key={key} />;
                })}
            </div>
        );
    };
    const onArray = createStore([1, 2, 3, 4, 5]);

    it('should not rerender the list elements', () => {
        const { getAllByTestId, getByText } = render(<Numbers onArray={onArray} />, { wrapper: Provider });
        const prepend = getByText('prepend');
        fireEvent.click(prepend);
        const elems = getAllByTestId('display');
        const renders = getAllByTestId('renders');
        expect(elems.map((x) => x.textContent)).toStrictEqual(['0', '1', '2', '3', '4', '5']);
        expect(renders.map((x) => x.textContent)).toEqual(['1', '1', '1', '1', '1', '1']);
    });
});
