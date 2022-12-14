import { pureOptic } from './pureOptic';
import { PureOptic } from './PureOptic.types';
import { total, partial, mapped, Path } from './types';
import { noop } from './utils';

const expectTotal: <A = any, S = any>(o: PureOptic<A, total, S>) => void = noop;
const expectPartial: <A = any, T extends partial = partial, S = any>(
    o: partial extends T ? PureOptic<A, T, S> : never,
) => void = noop;
const expectMapped: <A = any, S = any>(o: PureOptic<A, mapped, S>) => void = noop;

describe('compose types', () => {
    /**
     * total on non nullable + total = total
     */
    expectTotal(
        pureOptic<{ foo: string }>()
            .focus('foo')
            .compose({} as PureOptic<boolean>),
    );

    /**
     * total on nullable + total = partial
     */
    expectPartial(
        pureOptic<{ foo: string | undefined }>()
            .focus('foo')
            .compose({} as PureOptic<boolean, total, string>),
    );

    /**
     * total + partial = partial
     */
    expectPartial(
        pureOptic<{ foo: string }>()
            .focus('foo')
            .compose({} as PureOptic<boolean, partial>),
    );

    /**
     * total + mapped = mapped
     */
    expectMapped(
        pureOptic<{ foo: string[] }>()
            .focus('foo')
            .compose({} as PureOptic<boolean, mapped>),
    );

    /**
     * partial + total = partial
     */
    expectPartial(
        pureOptic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as PureOptic<boolean>),
    );

    /**
     * partial + partial = partial
     */
    expectPartial(
        pureOptic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as PureOptic<boolean, partial>),
    );

    /**
     * partial + mapped = mapped
     */
    expectMapped(
        pureOptic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as PureOptic<boolean, mapped>),
    );

    /**
     * mapped + total = mapped
     */
    expectMapped(({} as PureOptic<string, mapped>).compose({} as PureOptic<boolean>));

    /**
     * mapped + partial = mapped
     */
    expectMapped(({} as PureOptic<string, mapped>).compose({} as PureOptic<boolean, partial>));

    /**
     * mapped + mapped = mapped
     */
    expectMapped(({} as PureOptic<string, mapped>).compose({} as PureOptic<boolean, mapped>));
});

describe('lens', () => {
    it('shoud be a subtype of partial', () => {
        const lens = {} as PureOptic<any, total>;
        const partial: PureOptic<any, partial> = lens;
    });
    it("should't be a supertype of partial", () => {
        const partial = {} as PureOptic<string, partial>;
        // @ts-expect-error partial isn't assignable to total
        const total: PureOptic<string> = partial;
    });
    it('toPartial should return a partial focusing on the nonnullable type', () => {
        const onNullable = pureOptic<{ a: string | null | undefined }>().focus('a');
        expectPartial<string>(onNullable.toPartial());
    });
});
describe('paths', () => {
    type NestedRecord<Depth, Levels extends any[] = []> = Levels['length'] extends Depth
        ? string
        : { [P in Levels['length'] as `level${P}`]: NestedRecord<Depth, [any, ...Levels]> };

    it('should handle big objects without reaching the type instantiation depth limit', () => {
        type Record30Deep = NestedRecord<30>;
        type AllPaths = Path<Record30Deep>;
    });
});
