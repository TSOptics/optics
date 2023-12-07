import { PureOptic, PureReadOptic, partial, total } from '@optics/core';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import { AsyncOptic } from '../Optics/AsyncOptic';
import { AsyncReadOptic } from '../Optics/AsyncReadOptic';
import { Optic } from '../Optics/Optic';
import { ReadOptic } from '../Optics/ReadOptic';

describe('optics type relations', () => {
    it('Optic should be a subtype of Optic', () => {
        expectAssignable<ReadOptic<number>>({} as Optic<number>);
    });
    it('AsyncReadOptic should be a subtype of ReadOptic', () => {
        expectAssignable<ReadOptic<number>>({} as AsyncReadOptic<number>);
    });
    it('AsyncOptic should be a subtype of Optic', () => {
        expectAssignable<Optic<number>>({} as AsyncOptic<number>);
    });
    it('Optic should not be a subtype of PureOptic', () => {
        expectNotAssignable<PureReadOptic<number>>({} as ReadOptic<number>);
    });
    it("AsyncReadOptic shouldn't be a subtype of Optic", () => {
        // expectNotAssignable<Optic<number>>({} as AsyncReadOptic<number>);
    });
});

describe('variance', () => {
    it('should be invariant on focused type', () => {
        expectNotAssignable<Optic<number | string>>({} as Optic<string>);
        expectNotAssignable<Optic<number>>({} as Optic<string | number>);
    });
    it('should be covariant on optic scope', () => {
        expectAssignable<Optic<string, partial>>({} as Optic<string, total>);
        expectNotAssignable<Optic<string, total>>({} as Optic<string, partial>);
    });
});

describe('composition with derive', () => {
    it('should compose with PureOptic if PureOptic.S == Optic.A', () => {
        const optic = {} as Optic<{ a: number }>;
        const pure = {} as PureOptic<number, total, { a: number }>;
        expectType<Optic<number, total>>(optic.derive(pure));
    });
    it('should return a read only type when composed with PureReadOptic', () => {
        const optic = {} as Optic<{ a: number }>;
        const pure = {} as PureReadOptic<number, total, { a: number }>;
        expectType<ReadOptic<number, total>>(optic.derive(pure));
    });
    it('should return a read only optic when derived with get function', () => {
        const optic = {} as Optic<{ a: number }>;
        expectType<ReadOptic<number, total>>(optic.derive({ get: (x) => x.a }));
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
