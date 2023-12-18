import { PureOptic } from '../PureOptic/PureOptic';
import { total, partial, mapped } from '../types';
import { toPartial } from '../combinators/toPartial';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import { DataOptic } from '../DataOptic/DataOptic';

declare const dataOpticTotal: DataOptic<string, total, string>;
declare const dataOpticTotalOnNullable: DataOptic<string | null | undefined, total, string>;
declare const dataOpticPartial: DataOptic<string, partial, string>;
declare const dataOpticMapped: DataOptic<string, mapped, string>;

declare const pureOpticTotal: PureOptic<string, total, string>;
declare const pureOpticPartial: PureOptic<string, partial, string>;
declare const pureOpticMapped: PureOptic<string, mapped, string>;

describe('OpticScope', () => {
    it('total + total = total', () => expectType<typeof dataOpticTotal>(dataOpticTotal.derive(pureOpticTotal)));

    it('total on nullable + total = partial', () =>
        expectType<typeof dataOpticPartial>(dataOpticTotalOnNullable.derive(pureOpticTotal)));

    it('total + partial = partial', () => expectType<typeof dataOpticPartial>(dataOpticTotal.derive(pureOpticPartial)));

    it('total + mapped = mapped', () => expectType<typeof dataOpticMapped>(dataOpticTotal.derive(pureOpticMapped)));

    it('partial + total = partial', () => expectType<typeof dataOpticPartial>(dataOpticPartial.derive(pureOpticTotal)));

    it('partial + partial = partial', () =>
        expectType<typeof dataOpticPartial>(dataOpticPartial.derive(pureOpticPartial)));

    it('partial + mapped = mapped', () => expectType<typeof dataOpticMapped>(dataOpticPartial.derive(pureOpticMapped)));

    it('mapped + total = mapped', () => expectType<typeof dataOpticMapped>(dataOpticMapped.derive(pureOpticTotal)));

    it('mapped + partial = mapped', () => expectType<typeof dataOpticMapped>(dataOpticMapped.derive(pureOpticPartial)));

    it('mapped + mapped = mapped', () => expectType<typeof dataOpticMapped>(dataOpticMapped.derive(pureOpticMapped)));
});

describe('Type relations', () => {
    it('should be covariant on scope', () => {
        expectAssignable<typeof dataOpticPartial>(dataOpticTotal);
        expectNotAssignable<typeof dataOpticTotal>(dataOpticPartial);
    });
    it('should be partial focused on non-nullable when derived with toPartial', () => {
        expectType<typeof dataOpticPartial>(dataOpticTotalOnNullable.derive(toPartial()));
    });
});
