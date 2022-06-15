import { optic } from '../src/constructors';
import { Optic } from '../src/Optic';
import { total, partial, mapped } from '../src/types';
import { noop } from '../src/utils';

const expectTotal: <A = any, S = any>(o: Optic<A, total, S>) => void = noop;
const expectPartial: <A = any, T extends partial = partial, S = any>(
    o: partial extends T ? Optic<A, T, S> : never,
) => void = noop;
const expectMapped: <A = any, S = any>(o: Optic<A, mapped, S>) => void = noop;

describe('compose types', () => {
    /**
     * total on non nullable + total = total
     */
    expectTotal(
        optic<{ foo: string }>()
            .focus('foo')
            .compose({} as Optic<boolean>),
    );

    /**
     * total on nullable + total = partial
     */
    expectPartial(
        optic<{ foo: string | undefined }>()
            .focus('foo')
            .compose({} as Optic<boolean, total, string>),
    );

    /**
     * total + partial = partial
     */
    expectPartial(
        optic<{ foo: string }>()
            .focus('foo')
            .compose({} as Optic<boolean, partial>),
    );

    /**
     * total + mapped = mapped
     */
    expectMapped(
        optic<{ foo: string[] }>()
            .focus('foo')
            .compose({} as Optic<boolean, mapped>),
    );

    /**
     * partial + total = partial
     */
    expectPartial(
        optic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as Optic<boolean>),
    );

    /**
     * partial + partial = partial
     */
    expectPartial(
        optic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as Optic<boolean, partial>),
    );

    /**
     * partial + mapped = mapped
     */
    expectMapped(
        optic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as Optic<boolean, mapped>),
    );

    /**
     * mapped + total = mapped
     */
    expectMapped(({} as Optic<string, mapped>).compose({} as Optic<boolean>));

    /**
     * mapped + partial = mapped
     */
    expectMapped(({} as Optic<string, mapped>).compose({} as Optic<boolean, partial>));

    /**
     * mapped + mapped = mapped
     */
    expectMapped(({} as Optic<string, mapped>).compose({} as Optic<boolean, mapped>));
});

describe('lens', () => {
    it('shoud be a subtype of partial', () => {
        const lens: Optic<any, total> = new Optic([]);
        const partial: Optic<any, partial> = lens;
    });
    it("should't be a supertype of partial", () => {
        const partial: Optic<any, partial> = new Optic([]);
        // @ts-expect-error partial isn't assignable to total
        const total: Optic<any> = partial;
    });
    it('toPartial should return a partial focusing on the nonnullable type', () => {
        const onNullable = optic<{ a: string | null | undefined }>().focus('a');
        expectPartial<string>(onNullable.toPartial());
    });
});
describe('paths', () => {
    type RecursiveRecord<Depth extends number, Levels extends number[] = []> = Levels['length'] extends Depth
        ? 42
        : { [Level in Levels['length'] as `level_${Level}`]: RecursiveRecord<Depth, [0, ...Levels]> };

    it('should handle deep paths', () => {
        type DeepRecord = RecursiveRecord<30>;
        const onLastLevel = optic<DeepRecord>().focus(
            'level_0.level_1.level_2.level_3.level_4.level_5.level_6.level_7.level_8.level_9.level_10.level_11.level_12.level_13.level_14.level_15.level_16.level_17.level_18.level_19.level_20.level_21.level_22.level_23.level_24.level_25.level_26.level_27.level_28.level_29',
        );
    });
});
