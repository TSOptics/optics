import { pureOptic } from './pureOpticConstructor';
import { PureOptic } from './PureOptic';
import { PureReadOptic } from './PureReadOptic';
import { total, partial, mapped } from './types';
import { find } from './combinators/find';
import { toPartial } from './combinators/toPartial';

const expectTotal: <A = any, S = any>(thunk: () => PureOptic<A, total, S>) => void = () => {};
const expectPartial: <A = any, T extends partial = partial, S = any>(
    thunk: partial extends T ? () => PureOptic<A, T, S> : never,
) => void = () => {};
const expectMapped: <A = any, S = any>(thunk: () => PureOptic<A, mapped, S>) => void = () => {};

const expectWritableOptic: <A = any, S = any>(thunk: () => PureOptic<A, total, S>) => void = () => {};

describe('Derived types', () => {
    describe('OpticScope', () => {
        /**
         * total on non nullable + total = total
         */
        expectTotal(() => pureOptic<{ foo: string }>().foo.derive({} as PureOptic<boolean>));

        /**
         * total on nullable + total = partial
         */
        expectPartial(() =>
            pureOptic<{ foo: string | undefined }>().foo.derive({} as PureOptic<boolean, total, string>),
        );

        /**
         * total + partial = partial
         */
        expectPartial(() => pureOptic<{ foo: string }>().foo.derive({} as PureOptic<boolean, partial, string>));

        /**
         * total + mapped = mapped
         */
        expectMapped(() => pureOptic<{ foo: string[] }>().foo.derive({} as PureOptic<boolean, mapped, string[]>));

        /**
         * partial + total = partial
         */
        expectPartial(() => pureOptic<{ foo?: { bar: string } }>().foo.bar.derive({} as PureOptic<boolean>));

        /**
         * partial + partial = partial
         */
        expectPartial(() =>
            pureOptic<{ foo?: { bar: string } }>().foo.bar.derive({} as PureOptic<boolean, partial, string>),
        );

        /**
         * partial + mapped = mapped
         */
        expectMapped(() =>
            pureOptic<{ foo?: { bar: string } }>().foo.bar.derive({} as PureOptic<boolean, mapped, string>),
        );

        /**
         * mapped + total = mapped
         */
        expectMapped(() => (({} as PureOptic<string, mapped>).derive({} as PureOptic<boolean>)));

        /**
         * mapped + partial = mapped
         */
        expectMapped(() => (({} as PureOptic<string, mapped>).derive({} as PureOptic<boolean, partial, string>)));

        /**
         * mapped + mapped = mapped
         */
        expectMapped(() => (({} as PureOptic<string, mapped>).derive({} as PureOptic<boolean, mapped, string>)));
    });
    describe('Writable status', () => {
        /**
         * PureOptic + PureReadOptic = PureReadOptic
         */
        // @ts-expect-error PureOptic isn't assignable to PureReadOptic
        expectWritableOptic(() => pureOptic<string>().derive({} as PureReadOptic<string, total, string>));

        /**
         * PureReadOptic + PureOptic = PureReadOptic
         */
        expectWritableOptic(
            // @ts-expect-error PureOptic isn't assignable to PureReadOptic
            () => (pureOptic<string>() as PureReadOptic<string>).derive({} as PureOptic<string, total, string>),
        );

        /**
         * PureReadOptic + PureReadOptic = PureReadOptic
         */
        expectWritableOptic(
            // @ts-expect-error PureOptic isn't assignable to PureReadOptic
            () => (pureOptic<string>() as PureReadOptic<string>).derive({} as PureReadOptic<string, total, string>),
        );

        /**
         * PureOptic + PureOptic = PureOptic
         */
        // @ts-expect-error PureOptic isn't assignable to PureReadOptic
        expectWritableOptic(() => pureOptic<string>().derive({} as PureReadOptic<string, total, string>));

        /**
         * PureOptic + get = PureReadOptic
         */
        // @ts-expect-error PureOptic isn't assignable to PureReadOptic
        expectWritableOptic(() => pureOptic<{ foo: string }>().derive({ get: (x) => x.foo }));
        /**
         * PureReadOptic + get = PureReadOptic
         */
        expectWritableOptic(() =>
            // @ts-expect-error PureOptic isn't assignable to PureReadOptic
            (pureOptic<{ foo: string }>() as PureReadOptic<{ foo: string }>).derive({ get: (x) => x.foo }),
        );

        /**
         * PureOptic + get & set = PureOptic
         */
        expectWritableOptic(() =>
            pureOptic<{ foo: string }>().derive({ get: (x) => x.foo, set: (x, y) => ({ ...y, foo: x }) }),
        );
    });
});

describe('Type relations', () => {
    describe('total', () => {
        it('should be a subtype of partial', () => {
            const lens = {} as PureOptic<any, total>;
            const partial: PureOptic<any, partial> = lens;
        });
        it("shouldn't be a supertype of partial", () => {
            const partial = {} as PureOptic<string, partial>;
            // @ts-expect-error partial isn't assignable to total
            const total: PureOptic<string> = partial;
        });
        it('should become a partial focusing on the non-nullable type when called with toPartial', () => {
            const nullableOptic = pureOptic<{ a: string | null | undefined }>().a;
            expectPartial<string>(() => nullableOptic.derive(toPartial()));
        });
    });
    describe('PureReadOptic', () => {
        it('should be a supertype of PureOptic', () => {
            const readOptic = {} as PureOptic<string, total>;
            const optic: PureReadOptic<string> = readOptic;
        });
        it("shouldn't be a subtype of PureOptic", () => {
            const readOptic = {} as PureReadOptic<string, total>;
            // @ts-expect-error PureOptic isn't assignable to PureReadOptic
            const optic: PureOptic<string> = readOptic;
        });
        it('should return a PureReadOptic when calling combinators', () => {
            const stringReadOptic: PureReadOptic<string> = pureOptic<string>();
            const numberOptic: PureReadOptic<number> = stringReadOptic.derive({ get: parseInt, set: (n) => `${n}` });

            const numbersReadOptic: PureReadOptic<number[]> = pureOptic<number[]>();
            const firstPositiveOptic: PureReadOptic<number, partial> = numbersReadOptic.derive(find((n) => n > 0));
        });
    });
});
