import { PureOptic } from '../PureOptic/PureOptic';
import { partial, mapped, readOnly } from '../types';
import { toPartial } from '../combinators/toPartial';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';

declare const totalOptic: PureOptic<string, {}, string>;
declare const totalOnNullableOptic: PureOptic<string | null | undefined, {}, string>;
declare const partialOptic: PureOptic<string, partial, string>;
declare const mappedOptic: PureOptic<string, mapped, string>;

describe('OpticScope', () => {
    it('total + total = total', () => expectType<typeof totalOptic>(totalOptic.derive(totalOptic)));

    it('total on nullable + total = partial', () =>
        expectType<typeof partialOptic>(totalOnNullableOptic.derive(totalOptic)));

    it('total + partial = partial', () => expectType<typeof partialOptic>(totalOptic.derive(partialOptic)));

    it('total + mapped = mapped', () => expectType<typeof mappedOptic>(totalOptic.derive(mappedOptic)));

    it('partial + total = partial', () => expectType<typeof partialOptic>(partialOptic.derive(totalOptic)));

    it('partial + partial = partial', () => expectType<typeof partialOptic>(partialOptic.derive(partialOptic)));

    it('partial + mapped = mapped & partial', () =>
        expectAssignable<typeof mappedOptic>(partialOptic.derive(mappedOptic)));

    it('mapped + total = mapped', () => expectType<typeof mappedOptic>(mappedOptic.derive(totalOptic)));

    it('mapped + partial = mapped & partial', () =>
        expectAssignable<typeof mappedOptic>(mappedOptic.derive(partialOptic)));

    it('mapped + mapped = mapped', () => expectType<typeof mappedOptic>(mappedOptic.derive(mappedOptic)));
});

declare const optic: PureOptic<string>;
declare const readonlyOptic: PureOptic<string, readOnly>;

describe('Writable status', () => {
    it('PureOptic + PureReadOptic = PureReadOptic', () =>
        expectType<typeof readonlyOptic>(optic.derive(readonlyOptic)));

    it('PureReadOptic + PureOptic = PureReadOptic', () =>
        expectType<typeof readonlyOptic>(readonlyOptic.derive(optic)));

    it('PureReadOptic + PureReadOptic = PureReadOptic', () =>
        expectType<typeof readonlyOptic>(readonlyOptic.derive(readonlyOptic)));

    it('PureOptic + PureOptic = PureOptic', () => expectType<typeof optic>(optic.derive(optic)));

    it('PureOptic + get = PureReadOptic', () => expectType<typeof readonlyOptic>(optic.derive({ get: (x) => x })));

    it('PureOptic + get & set = PureOptic', () =>
        expectType<typeof optic>(optic.derive({ get: (x) => x, set: (x) => x })));

    it('PureReadOptic + get & set = PureReadOptic', () =>
        expectType<typeof readonlyOptic>(readonlyOptic.derive({ get: (x) => x, set: (x) => x })));
});

describe('Type relations', () => {
    it('should be covariant on scope', () => {
        expectAssignable<typeof partialOptic>(totalOptic);
        expectNotAssignable<typeof totalOptic>(partialOptic);
    });
    it('should be partial focused on non-nullable when derived with toPartial', () => {
        expectType<typeof partialOptic>(totalOnNullableOptic.derive(toPartial()));
    });
    it('should be subtype of PureReadOptic', () => {
        expectAssignable<typeof readonlyOptic>(totalOptic);
        expectNotAssignable<typeof optic>(readonlyOptic);
    });
});
