import { pureOptic } from './pureOpticConstructor';
import { PureOptic } from './PureOptic';
import { PureReadOptic } from './PureReadOptic';
import { total, partial, mapped } from './types';

const expectTotal: <A = any, S = any>(o: () => PureOptic<A, total, S>) => void = () => {};
const expectPartial: <A = any, T extends partial = partial, S = any>(
    o: partial extends T ? () => PureOptic<A, T, S> : never,
) => void = () => {};
const expectMapped: <A = any, S = any>(o: () => PureOptic<A, mapped, S>) => void = () => {};

describe('compose types', () => {
    /**
     * total on non nullable + total = total
     */
    expectTotal(() => pureOptic<{ foo: string }>().foo.compose({} as PureOptic<boolean>));

    /**
     * total on nullable + total = partial
     */
    expectPartial(() => pureOptic<{ foo: string | undefined }>().foo.compose({} as PureOptic<boolean, total, string>));

    /**
     * total + partial = partial
     */
    expectPartial(() => pureOptic<{ foo: string }>().foo.compose({} as PureOptic<boolean, partial>));

    /**
     * total + mapped = mapped
     */
    expectMapped(() => pureOptic<{ foo: string[] }>().foo.compose({} as PureOptic<boolean, mapped>));

    /**
     * partial + total = partial
     */
    expectPartial(() => pureOptic<{ foo?: { bar: string } }>().foo.bar.compose({} as PureOptic<boolean>));

    /**
     * partial + partial = partial
     */
    expectPartial(() => pureOptic<{ foo?: { bar: string } }>().foo.bar.compose({} as PureOptic<boolean, partial>));

    /**
     * partial + mapped = mapped
     */
    expectMapped(() => pureOptic<{ foo?: { bar: string } }>().foo.bar.compose({} as PureOptic<boolean, mapped>));

    /**
     * mapped + total = mapped
     */
    expectMapped(() => (({} as PureOptic<string, mapped>).compose({} as PureOptic<boolean>)));

    /**
     * mapped + partial = mapped
     */
    expectMapped(() => (({} as PureOptic<string, mapped>).compose({} as PureOptic<boolean, partial>)));

    /**
     * mapped + mapped = mapped
     */
    expectMapped(() => (({} as PureOptic<string, mapped>).compose({} as PureOptic<boolean, mapped>)));
});

describe('PureOptic', () => {
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
            const onNullable = pureOptic<{ a: string | null | undefined }>().a;
            expectPartial<string>(() => onNullable.toPartial());
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
            const onStringRead: PureReadOptic<string> = pureOptic<string>();
            // @ts-expect-error PureOptic isn't assignable to PureReadOptic
            const onNumber: PureOptic<number> = onStringRead.convert(parseInt, (n) => `${n}`);

            const onNumbersRead: PureReadOptic<number[]> = pureOptic<number[]>();
            // @ts-expect-error PureOptic isn't assignable to PureReadOptic
            const onFirstPositive: PureOptic<number, partial> = onNumbersRead.findFirst((n) => n > 0);
        });
    });
});
