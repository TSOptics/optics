import { optic } from '../src/constructors';
import { Optic } from '../src/Optic';
import { total, partial, map, reduce } from '../src/types';
import { noop } from '../src/utils';

const expectTotal: <A = any, S = any>(o: Optic<A, total, S>) => void = noop;
const expectPartial: <A = any, T extends partial = partial, S = any>(
    o: partial extends T ? Optic<A, T, S> : never,
) => void = noop;
const expectMap: <A = any, S = any>(o: Optic<A, map, S>) => void = noop;
const expectReduce: <A = any, S = any>(o: Optic<A, reduce, S>) => void = noop;
const expectVoid: (_: void) => void = noop;

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
     * total + traversal = traversal
     */
    expectMap(
        optic<{ foo: string[] }>()
            .focus('foo')
            .compose({} as Optic<boolean, map>),
    );

    /**
     * total + fold = void
     */
    expectVoid(
        optic<{ foo: string[] }>()
            .focus('foo')
            .compose({} as Optic<boolean, reduce>),
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
     * partial + traversal = traversal
     */
    expectMap(
        optic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as Optic<boolean, map>),
    );
    /**
     * partial + fold = void
     */
    expectVoid(
        optic<{ foo?: { bar: string } }>()
            .focus('foo?.bar')
            .compose({} as Optic<boolean, reduce>),
    );

    /**
     * traversal + total = traversal
     */
    expectMap(({} as Optic<string, map>).compose({} as Optic<boolean>));

    /**
     * traversal + partial = traversal
     */
    expectMap(({} as Optic<string, map>).compose({} as Optic<boolean, partial>));

    /**
     * traversal + traversal = traversal
     */
    expectMap(({} as Optic<string, map>).compose({} as Optic<boolean, map>));

    /**
     * traversal + fold = fold
     */
    expectReduce(({} as Optic<string, map>).compose({} as Optic<boolean, reduce>));

    /**
     * fold + total = fold
     */
    expectReduce(({} as Optic<string, reduce>).compose({} as Optic<boolean>));

    /**
     * fold + partial = fold
     */
    expectReduce(({} as Optic<string, reduce>).compose({} as Optic<boolean, partial>));

    /**
     * fold + traversal = traversal
     */
    expectMap(({} as Optic<string, reduce>).compose({} as Optic<boolean, map>));

    /**
     * fold + total = fold
     */
    expectVoid(({} as Optic<string, reduce>).compose({} as Optic<boolean, reduce>));
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
