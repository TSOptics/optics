import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-test-renderer';
import { render } from '@testing-library/react';
import { useOptic } from './useOptic';
import { Optic, createState, ReadOptic } from '@optics/state';

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
    describe('references', () => {
        const contactOptic = createState({ phone: '+33**', mail: 'foo@bar.com' });
        const stateOptic = createState({ name: 'foobar', contact: contactOptic });

        it('should denormalize the result with the denormalize option', () => {
            const { result } = renderHook(() => useOptic(stateOptic, { denormalize: true }));
            expect(result.current[0]).toEqual({ name: 'foobar', contact: { phone: '+33**', mail: 'foo@bar.com' } });
        });
        it("should't denormalize by default", () => {
            const { result } = renderHook(() => useOptic(stateOptic));
            expect(result.current[0]).toEqual({ name: 'foobar', contact: contactOptic });
        });
    });
});
