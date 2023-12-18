/* eslint-disable react-hooks/rules-of-hooks */
import { AsyncOptic, AsyncReadOptic, Optic, PureOptic, ReadOptic, mapped, partial } from '@optics/state';
import { expectType } from 'tsd';
import { Dispatch, SetStateAction } from 'react';
import { useOptic } from '../useOptic';

describe('optic type', () => {
    it('should return the value and a setter for write optics', () => {
        expectType<[number, { setState: Dispatch<SetStateAction<number>> }]>(useOptic({} as Optic<number>));
        expectType<[number, { setState: Dispatch<SetStateAction<number>> }]>(useOptic({} as AsyncOptic<number>));
    });
    it('should return only the value for read optics', () => {
        expectType<[number]>(useOptic({} as ReadOptic<number>));
        expectType<[number]>(useOptic({} as AsyncReadOptic<number>));
    });
    it("shouldn't accept non stateful optics", () => {
        // @ts-expect-error
        useOptic({} as PureOptic<number>);
    });
});

describe('optic scope', () => {
    it('should return a nullable value for partial optic', () => {
        expectType<[number | undefined, { setState: Dispatch<SetStateAction<number>> }]>(
            useOptic({} as Optic<number, partial>),
        );
    });
    it('should return an array for mapped optic', () => {
        expectType<[number[], { setState: Dispatch<SetStateAction<number>> }]>(useOptic({} as Optic<number, mapped>));
    });
});

describe('references', () => {
    type StateWithRef = { a: Optic<{ b: number }> };
    it("should return the normalized value if denormalized isn't explicitly set to true", () => {
        expectType<[StateWithRef, { setState: Dispatch<SetStateAction<StateWithRef>> }]>(
            useOptic({} as Optic<StateWithRef>),
        );
        expectType<[StateWithRef, { setState: Dispatch<SetStateAction<StateWithRef>> }]>(
            useOptic({} as Optic<StateWithRef>, {}),
        );
        expectType<[StateWithRef, { setState: Dispatch<SetStateAction<StateWithRef>> }]>(
            useOptic({} as Optic<StateWithRef>, { denormalize: false }),
        );
    });
    it('should return the denormalized value if denormalized is explicitly set to true', () => {
        expectType<[{ a: { b: number } }, { setState: Dispatch<SetStateAction<StateWithRef>> }]>(
            useOptic({} as Optic<StateWithRef>, { denormalize: true }),
        );
    });
});
