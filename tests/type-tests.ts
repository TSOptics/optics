import { findFirst, optix } from '../combinators';
import { Optix, _Partial, _Total } from '../lens';

const expect = <T>(t: T) => {
    // type level test
};

const expectNot = <T>(t: T) => {
    // type level test
};

// composing on lens focusing a nullable type should return an optional
const composed1 = optix<{ yolo: string | undefined }>()
    .focus('yolo')
    .compose({} as Optix<boolean, _Total>);
// @ts-expect-error shoud be partial
expectNot<Optix<any, _Total>>(composed1);

const composed1_1 = optix<{ yolo: string | undefined }>()
    .focus('yolo')
    .compose({} as Optix<boolean, _Partial>);

// @ts-expect-error shoud be partial
expectNot<Optix<any, _Total>>(composed1_1);

// composing a lens with an optional shoud return an optional
const composed2 = optix<{ yolo: string }>()
    .focus('yolo')
    .compose({} as Optix<boolean, _Partial>);
// @ts-expect-error shoud be partial
expectNot<Optix<any, _Total>>(composed2);

// composing an optional with a lens should return an optional
const composed3 = optix<{ yolo?: { swag: string } }>()
    .focus('yolo')
    .focus('swag')
    .compose({} as Optix<boolean>);
// @ts-expect-error shoud be partial
expectNot<Optix<any, _Total>>(composed3);

// composing an optional with an optional should return an optional
const composed4 = optix<{ yolo?: { swag: string } }>()
    .focus('yolo')
    .focus('swag')
    .compose({} as Optix<boolean, _Partial>);
// @ts-expect-error shoud be partial
expectNot<Optix<any, _Total>>(composed4);

// composing a lens with a lens shoud return a lens
const composed5 = optix<{ yolo: string }>()
    .focus('yolo')
    .compose({} as Optix<boolean>);
expect<Optix<any, _Total>>(composed5);

const test = optix<{ yolo: { swag: string }[] }>()
    .focus('yolo')
    .compose(findFirst((x) => x.swag === 'swag'))
    .focus('swag');
