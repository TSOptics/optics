import { optic, Optic, partial, total } from '../src';

const expect = <T>(t: T) => {
    // type level test
};

const expectNot = <T>(t: T) => {
    // type level test
};

/**
 * composing on lens focusing a nullable type should return an optional
 */
const composed1 = optic<{ yolo: string | undefined }>()
    .focus('yolo')
    .compose({} as Optic<boolean, total>);
// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed1);

const composed1_1 = optic<{ yolo: string | undefined }>()
    .focus('yolo')
    .compose({} as Optic<boolean, partial>);

// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed1_1);

/**
 * composing a lens with an optional shoud return an optional
 * */
const composed2 = optic<{ yolo: string }>()
    .focus('yolo')
    .compose({} as Optic<boolean, partial>);
// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed2);

/**
 * composing an optional with a lens should return an optional
 * */
const composed3 = optic<{ yolo?: { swag: string } }>()
    .focus('yolo')
    .focus('swag')
    .compose({} as Optic<boolean>);
// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed3);

/**
 * composing an optional with an optional should return an optional
 * */
const composed4 = optic<{ yolo?: { swag: string } }>()
    .focus('yolo')
    .focus('swag')
    .compose({} as Optic<boolean, partial>);
// @ts-expect-error shoud be partial
expectNot<Optic<any, total>>(composed4);

/**
 * composing a lens with a lens shoud return a lens
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
