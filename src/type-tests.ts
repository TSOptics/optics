import { optic } from './constructors';
import { BaseOptic } from './BaseOptic';
import { total, partial, mapped, Path } from './types';
import { noop } from './utils';

const expectTotal: <A = any, S = any>(o: BaseOptic<A, total, S>) => void = noop;
const expectPartial: <A = any, T extends partial = partial, S = any>(
    o: partial extends T ? BaseOptic<A, T, S> : never,
) => void = noop;
const expectMapped: <A = any, S = any>(o: BaseOptic<A, mapped, S>) => void = noop;

describe('compose types', () => {
    /**
     * total on non nullable + total = total
     */
    expectTotal(
        optic<{ foo: string }>()
            .focus('foo')
            .compose({} as BaseOptic<boolean>),
    );

    /**
     * total on nullable + total = partial
     */
    expectPartial(
        optic<{ foo: string | undefined }>()
            .focus('foo')
            .compose({} as BaseOptic<boolean, total, string>),
    );

    /**
     * total + partial = partial
     */
    expectPartial(
        optic<{ foo: string }>()
            .focus('foo')
            .compose({} as BaseOptic<boolean, partial>),
    );

    /**
     * total + mapped = mapped
     */
    expectMapped(
        optic<{ foo: string[] }>()
            .focus('foo')
            .compose({} as BaseOptic<boolean, mapped>),
    );

    /**
     * partial + total = partial
     */
    expectPartial(
        optic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as BaseOptic<boolean>),
    );

    /**
     * partial + partial = partial
     */
    expectPartial(
        optic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as BaseOptic<boolean, partial>),
    );

    /**
     * partial + mapped = mapped
     */
    expectMapped(
        optic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as BaseOptic<boolean, mapped>),
    );

    /**
     * mapped + total = mapped
     */
    expectMapped(({} as BaseOptic<string, mapped>).compose({} as BaseOptic<boolean>));

    /**
     * mapped + partial = mapped
     */
    expectMapped(({} as BaseOptic<string, mapped>).compose({} as BaseOptic<boolean, partial>));

    /**
     * mapped + mapped = mapped
     */
    expectMapped(({} as BaseOptic<string, mapped>).compose({} as BaseOptic<boolean, mapped>));
});

describe('lens', () => {
    it('shoud be a subtype of partial', () => {
        const lens: BaseOptic<any, total> = new BaseOptic([]);
        const partial: BaseOptic<any, partial> = lens;
    });
    it("should't be a supertype of partial", () => {
        const partial: BaseOptic<any, partial> = new BaseOptic([]);
        // @ts-expect-error partial isn't assignable to total
        const total: BaseOptic<any> = partial;
    });
    it('toPartial should return a partial focusing on the nonnullable type', () => {
        const onNullable = optic<{ a: string | null | undefined }>().focus('a');
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
