import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import createStore, { Provider } from '../src/react/createStore';
import useOptix from '../src/react/useOptix';
import { act } from 'react-test-renderer';
import { Optix } from '../src/lens';

describe('createStore', () => {
    it('should create an optix for each property', () => {
        expect(createStore({ foo: 'foo', bar: 'bar' })).toEqual(
            expect.objectContaining({ onFoo: expect.anything(), onBar: expect.anything() }),
        );
    });
    it('should return only the root optix if not object', () => {
        expect(createStore(42)).toStrictEqual({
            store: expect.anything(),
            provideStore: expect.anything(),
            onRoot: expect.any(Optix),
            setRoot: expect.any(Function),
        });
    });
});
describe('useOptix', () => {
    const initial = { test: 42 };
    const { onRoot, store, setRoot } = createStore(initial);
    const Wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;
    beforeEach(() => {
        setRoot(initial);
    });
    it('should set state', () => {
        const { result } = renderHook(() => useOptix(onRoot), { wrapper: Wrapper });
        act(() => result.current[1]((prev) => ({ test: prev.test * 2 })));
        expect(result.current[0]).toStrictEqual({ test: 84 });
    });
    it('should skip rerender if equalityFn returns true', () => {
        const { result } = renderHook(() => useOptix(onRoot, (_, newValue) => newValue.test > 100), {
            wrapper: Wrapper,
        });
        act(() => result.current[1]({ test: 120 }));
        expect(result.current[0]).toStrictEqual({ test: 42 });
        expect(store.root.ref).toStrictEqual({ test: 120 });
    });
    it('should be referentially stable', () => {
        const { result, rerender } = renderHook(() => useOptix(onRoot, (_, newValue) => newValue.test > 100), {
            wrapper: Wrapper,
        });
        const [prevState, prevSetState] = result.current;
        rerender();
        const [state, setState] = result.current;
        expect(prevState).toBe(state);
        expect(prevSetState).toBe(setState);
    });
});
