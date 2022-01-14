import { optic, Optic, opticPartial } from '../src/Optic';
import { total, partial } from '../src/types';

const expect = <T>(t: T) => {
    // type level test
};

const expectNot = <T>(t: T) => {
    // type level test
};

/**
 * composing a total optic focusing a nullable type with any optic should return a partial optic
 */
const composed1 = optic<{ yolo: string | undefined }>()
    .focus('yolo')
    .compose({} as Optic<boolean, total, string>);
// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed1);

const composed1_1 = optic<{ yolo: string | undefined }>()
    .focus('yolo')
    .compose({} as Optic<boolean, partial>);

// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed1_1);

/**
 * composing a total optic with a partial one shoud return a partial optic
 * */
const composed2 = optic<{ yolo: string }>()
    .focus('yolo')
    .compose({} as Optic<boolean, partial>);
// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed2);

/**
 * composing partial optic with a total one should return a partial optic
 * */
const composed3 = optic<{ yolo?: { swag: string } }>()
    .focus('yolo')
    .focus('swag')
    .compose({} as Optic<boolean>);
// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed3);

/**
 * composing a partial optic with a partial one should return partial optic
 * */
const composed4 = optic<{ yolo?: { swag: string } }>()
    .focus('yolo')
    .focus('swag')
    .compose({} as Optic<boolean, partial>);
// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed4);

/**
 * composing a total optic with a total one shoud return a total optic
 * */
const composed5 = optic<{ yolo: string }>()
    .focus('yolo')
    .compose({} as Optic<boolean>);
expect<Optic<any, total>>(composed5);

describe('lens', () => {
    it('shoud be a subtype of optional', () => {
        const lens: Optic<any, total> = new Optic([]);
        expect<Optic<any, partial>>(lens);
    });
    it("should't be a supertype of optional", () => {
        const optional: Optic<any, partial> = new Optic([]);
        // @ts-expect-error optional isn't assignable to lens
        expectNot<Optic<any, total>>(optional);
    });
    it('toPartial should return a partial focusing on the nonnullable type', () => {
        const onNullable = optic<{ a: string | null | undefined }>().focus('a');
        expect<Optic<string, partial, any>>(onNullable.toPartial());
    });
});
describe('compose', () => {
    it('should be able to take a new optic', () => {
        type Test = { k1: { k2: number } };
        const test = optic<Test>().compose(
            optic(
                (s) => s.k1,
                (a, s) => ({ ...s, k1: a }),
                'yolo',
            ),
        );
    });
    it('should be able to take a new partial', () => {
        const test = optic<number>().compose(
            opticPartial(
                (s) => (s > 10 ? s : undefined),
                (a, s) => (a > 10 ? a : s),
                'over 10',
            ),
        );
    });
});
