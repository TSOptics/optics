'use client';

import { GetOpticFocus, GetOpticScope, OpticScope, ReadOptic, Resolve } from '@optics/state';
import React, { ReactElement, cloneElement, memo } from 'react';
import { useDeriveOptics } from './useDeriveOptics';

const typedMemo: <T>(c: T) => T = memo;

type Props<TOptic extends ReadOptic<any[], any>, T extends any[], TScope extends OpticScope> = {
    optic: TOptic;
    getKey: (t: T[number]) => string;
    children: (t: Resolve<TOptic, T[number], TScope>, key: string) => ReactElement;
};

const For = typedMemo(
    <
        TOptic extends ReadOptic<any[], any>,
        T extends any[] = GetOpticFocus<TOptic>,
        TScope extends OpticScope = GetOpticScope<TOptic>,
    >({
        optic,
        getKey,
        children,
    }: Props<TOptic, T, TScope>) => {
        const optics = useDeriveOptics(optic, getKey);

        return <>{optics.map(([key, optic]) => cloneElement(children(optic, key), { key }))}</>;
    },
);

export default For;
