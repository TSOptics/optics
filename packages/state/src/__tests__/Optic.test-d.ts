import { PureOptic, partial, readOnly } from '@optics/core';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import { Optic } from '../Optics/Optic';
import { async } from '../types';

describe('optics type relations with modifiers', () => {
    it('Optic should be a subtype of readonly Optic', () => {
        expectAssignable<Optic<number, readOnly>>({} as Optic<number>);
    });
    it('async & read Optic should be a subtype of readonly Optic', () => {
        expectAssignable<Optic<number, readOnly>>({} as Optic<number, readOnly & async>);
    });
    it('async Optic should be a subtype of Optic', () => {
        expectAssignable<Optic<number>>({} as Optic<number, async>);
    });
    it('Optic should not be a subtype of PureOptic', () => {
        expectNotAssignable<PureOptic<number>>({} as Optic<number>);
    });
    it("async & read Optic shouldn't be a subtype of Optic", () => {
        expectNotAssignable<Optic<number>>({} as Optic<number, async & readOnly>);
    });
    it('Optic should be a subtype of partial Optic', () => {
        expectAssignable<Optic<number, partial>>({} as Optic<number>);
    });
});

describe('variance', () => {
    it('should be invariant on focused type', () => {
        expectNotAssignable<Optic<number | string>>({} as Optic<string>);
        expectNotAssignable<Optic<number>>({} as Optic<string | number>);
    });
});

describe('composition with derive', () => {
    it('should compose with PureOptic if PureOptic.S == Optic.A', () => {
        const optic = {} as Optic<{ a: number }>;
        const pure = {} as PureOptic<number, {}, { a: number }>;
        expectType<Optic<number>>(optic.derive(pure));
    });
    it('should return a readonly Optic when composed with readonly PureOptic', () => {
        const optic = {} as Optic<{ a: number }>;
        const pure = {} as PureOptic<number, readOnly, { a: number }>;
        expectType<Optic<number, readOnly>>(optic.derive(pure));
    });
    it('should return a readonly optic when derived with get function', () => {
        const optic = {} as Optic<{ a: number }>;
        expectType<Optic<number, readOnly>>(optic.derive({ get: (x) => x.a }));
    });
    it('should return an optic when derived with get and set function', () => {
        const optic = {} as Optic<{ a: number }>;
        expectType<Optic<number>>(optic.derive({ get: (x) => x.a, set: (a, x) => ({ ...x, a }) }));
    });
});

describe('references', () => {
    const opticWithReferences = {} as Optic<{ a: Optic<{ b: Optic<{ c: string }> }> }>;
    it("should return the normalized form if the 'denormalize' option isn't true", () => {
        expectType<{ a: Optic<{ b: Optic<{ c: string }> }> }>(opticWithReferences.get());
        expectType<{ a: Optic<{ b: Optic<{ c: string }> }> }>(opticWithReferences.get({}));
        expectType<{ a: Optic<{ b: Optic<{ c: string }> }> }>(opticWithReferences.get({ denormalize: false }));
    });
    it('should return the denormalized form if the denormalize option is true', () => {
        expectType<{ a: { b: { c: string } } }>(opticWithReferences.get({ denormalize: true }));
    });
});
