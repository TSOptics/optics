import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-test-renderer';
import { render } from '@testing-library/react';
import { useOptic } from '../useOptic';
import { Optic, createState } from '@optics/state';

describe('useOptic', () => {
    it('should set state', () => {
        const rootOptic = createState({ test: 42 });
        const { result } = renderHook(() => useOptic(rootOptic));
        act(() => result.current[1].setState((prev) => ({ test: prev.test * 2 })));
        expect(result.current[0]).toStrictEqual({ test: 84 });
    });

    it('should return referentially stable state and setter', () => {
        const rootOptic = createState({ test: 42 });
        const { result, rerender } = renderHook(() => useOptic(rootOptic));
        const [prevState, { setState: prevSetState }] = result.current;
        rerender();
        const [state, { setState }] = result.current;
        expect(prevState).toBe(state);
        expect(prevSetState).toBe(setState);
    });

    it('should not rerender when calling setter with the same reference', () => {
        const rootOptic = createState({ test: 42 });
        const { result } = renderHook(() => useOptic(rootOptic));
        const initialResult = result.current;
        act(() => initialResult[1].setState((prev) => prev));
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

    describe('getOptics', () => {
        it('should return referentially stable optics', () => {
            const usersOptic = createState([{ name: 'John' }, { name: 'Jeanne' }, { name: 'Vincent' }]);

            const { getOptics } = renderHook(() => useOptic(usersOptic)).result.current[1];
            const userOptics = getOptics((user) => user.name);

            act(() => usersOptic.set((prev) => [{ name: 'Marie' }, ...prev]));

            const newUserOptics = getOptics((user) => user.name);
            userOptics.forEach(([, optic], index) => expect(optic).toBe(newUserOptics[index + 1][1]));
        });
    });

    describe('getOpticsFromMapping', () => {
        it('should return referentially stable optics', () => {
            const stateOptic = createState([
                { country: 'USA', users: [{ name: 'John' }] },
                { country: 'France', users: [{ name: 'Jeanne' }, { name: 'Vincent' }] },
            ]);
            const mappedUsersOptic = stateOptic.map().users.map();

            const { getOpticsFromMapping } = renderHook(() => useOptic(mappedUsersOptic)).result.current[1];
            const userOptics = getOpticsFromMapping((user) => user.name);

            act(() => stateOptic.set((prev) => [{ country: 'España', users: [{ name: 'José' }] }, ...prev]));

            const newUserOptics = getOpticsFromMapping((user) => user.name);
            userOptics.forEach(([, optic], index) => expect(optic).toBe(newUserOptics[index + 1][1]));
        });
    });

    describe('hasValue', () => {
        const stateOptic = createState<{ name: string; contact?: { mail: string | undefined } }>({
            name: 'foobar',
            contact: { mail: 'foo@bar.com' },
        });
        const mailOptic = stateOptic.contact.mail;
        const useHasValue = () => {
            const [, { hasValue }] = useOptic(mailOptic);
            return hasValue((optic) => optic);
        };

        beforeEach(() => {
            stateOptic.set({
                name: 'foobar',
                contact: { mail: 'foo@bar.com' },
            });
        });

        it('should provide to the callback the same optic as the one passed to useOptic', () => {
            const { result } = renderHook(() => useHasValue());
            expect(result.current).toBe(mailOptic);
        });

        it('should return null if the optic has no value', () => {
            const { result } = renderHook(() => useHasValue());
            expect(result.current).not.toBe(null);
            act(() => stateOptic.set({ name: 'foobar' }));
            expect(result.current).toBe(null);
        });

        it('should return null if the focused value is undefined', () => {
            const { result } = renderHook(() => useHasValue());
            expect(result.current).not.toBe(null);
            act(() => mailOptic.set(undefined));
            expect(result.current).toBe(null);
        });
    });
    describe('guard', () => {
        type A = {
            type: 'a';
            a: number;
        };
        type B = {
            type: 'b';
            b: string;
        };
        type Union = A | B;

        const unionOptic = createState<Union>({ type: 'a', a: 42 });

        beforeEach(() => {
            unionOptic.set({ type: 'a', a: 42 });
        });

        it('should provide to the callback the same optic as the one passed to useOptic', () => {
            const { guard } = renderHook(() => useOptic(unionOptic)).result.current[1];
            guard((union) => union.type === 'a' && union)((optic) => expect(optic).toBe(unionOptic));
        });

        it('should return null if the guard is not satisfied', () => {
            const { guard } = renderHook(() => useOptic(unionOptic)).result.current[1];
            expect(guard((union) => union.type === 'b' && union)(() => 'success')).toBeNull();
        });
    });
});
