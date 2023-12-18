import { PureOptic } from '../PureOptic/PureOptic';
import { PureReadOptic } from '../PureOptic/PureReadOptic';
import { total, partial, mapped } from '../types';
import { toPartial } from '../combinators/toPartial';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';

declare const totalOptic: PureOptic<string, total, string>;
declare const totalOnNullableOptic: PureOptic<string | null | undefined, total, string>;
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

    it('partial + mapped = mapped', () => expectType<typeof mappedOptic>(partialOptic.derive(mappedOptic)));

    it('mapped + total = mapped', () => expectType<typeof mappedOptic>(mappedOptic.derive(totalOptic)));

    it('mapped + partial = mapped', () => expectType<typeof mappedOptic>(mappedOptic.derive(partialOptic)));

    it('mapped + mapped = mapped', () => expectType<typeof mappedOptic>(mappedOptic.derive(mappedOptic)));
});

declare const pureOptic: PureOptic<string>;
declare const pureReadOptic: PureReadOptic<string>;

describe('Writable status', () => {
    it('PureOptic + PureReadOptic = PureReadOptic', () =>
        expectType<typeof pureReadOptic>(pureOptic.derive(pureReadOptic)));

    it('PureReadOptic + PureOptic = PureReadOptic', () =>
        expectType<typeof pureReadOptic>(pureReadOptic.derive(pureOptic)));

    it('PureReadOptic + PureReadOptic = PureReadOptic', () =>
        expectType<typeof pureReadOptic>(pureReadOptic.derive(pureReadOptic)));

    it('PureOptic + PureOptic = PureOptic', () => expectType<typeof pureOptic>(pureOptic.derive(pureOptic)));

    it('PureOptic + get = PureReadOptic', () => expectType<typeof pureReadOptic>(pureOptic.derive({ get: (x) => x })));

    it('PureOptic + get & set = PureOptic', () =>
        expectType<typeof pureOptic>(pureOptic.derive({ get: (x) => x, set: (x) => x })));

    it('PureReadOptic + get & set = PureReadOptic', () =>
        expectType<typeof pureReadOptic>(pureReadOptic.derive({ get: (x) => x, set: (x) => x })));
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
        expectAssignable<typeof pureReadOptic>(totalOptic);
        expectNotAssignable<typeof pureOptic>(pureReadOptic);
    });
});
