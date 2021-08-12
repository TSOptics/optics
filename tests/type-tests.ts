import { optix, Optix, partial, total } from '../src/lens';

const expect = <T>(t: T) => {
    // type level test
};

const expectNot = <T>(t: T) => {
    // type level test
};

/**
 * composing on lens focusing a nullable type should return an optional
 */
const composed1 = optix<{ yolo: string | undefined }>()
    .focus('yolo')
    .compose({} as Optix<boolean, total>);
// @ts-expect-error shoud be partial
expectNot<Optix<any, total>>(composed1);

const composed1_1 = optix<{ yolo: string | undefined }>()
    .focus('yolo')
    .compose({} as Optix<boolean, partial>);

// @ts-expect-error shoud be partial
expectNot<Optix<any, total>>(composed1_1);

/**
 * composing a lens with an optional shoud return an optional
 * */
const composed2 = optix<{ yolo: string }>()
    .focus('yolo')
    .compose({} as Optix<boolean, partial>);
// @ts-expect-error shoud be partial
expectNot<Optix<any, total>>(composed2);

/**
 * composing an optional with a lens should return an optional
 * */
const composed3 = optix<{ yolo?: { swag: string } }>()
    .focus('yolo')
    .focus('swag')
    .compose({} as Optix<boolean>);
// @ts-expect-error shoud be partial
expectNot<Optix<any, total>>(composed3);

/**
 * composing an optional with an optional should return an optional
 * */
const composed4 = optix<{ yolo?: { swag: string } }>()
    .focus('yolo')
    .focus('swag')
    .compose({} as Optix<boolean, partial>);
// @ts-expect-error shoud be partial
expectNot<Optix<any, total>>(composed4);

/**
 * composing a lens with a lens shoud return a lens
 * */
const composed5 = optix<{ yolo: string }>()
    .focus('yolo')
    .compose({} as Optix<boolean>);
expect<Optix<any, total>>(composed5);

describe('lens', () => {
    it('shoud be a subtype of optional', () => {
        const lens: Optix<any, total> = new Optix([]);
        expect<Optix<any, partial>>(lens);
    });
    it("should't be a supertype of optional", () => {
        const optional: Optix<any, partial> = new Optix([]);
        // @ts-expect-error optional isn't assignable to lens
        expectNot<Optix<any, total>>(optional);
    });
    it('toPartial should return a partial focusing on the nonnullable type', () => {
        const onNullable = optix<{ a: string | null | undefined }>().focus('a');
        expect<Optix<string, partial, any>>(onNullable.toPartial());
    });
});
