'use client';

import { Modifiers, Optic, mapped } from '@optics/state';
import React, { ReactElement, ReactNode, cloneElement, memo } from 'react';
import { useOptic } from './useOptic';

const typedMemo: <T>(c: T) => T = memo;

function _For<TFocus extends any[], TModifiers extends Modifiers>(props: {
    optic: Optic<TFocus, TModifiers>;
    getKey: (value: TFocus[number]) => string;
    children: (optic: Optic<TFocus[number], Omit<TModifiers, 'partial'>>, key: string) => ReactElement;
}): ReactNode;
function _For<TFocus, TModifiers extends Modifiers & mapped>(props: {
    mappedOptic: Optic<TFocus, TModifiers>;
    getKey: (value: TFocus) => string;
    children: (optic: Optic<TFocus, Omit<TModifiers, 'map' | 'partial'>>, key: string) => ReactElement;
}): ReactNode;
function _For(params: any): ReactNode {
    const { optic, mappedOptic, getKey, children } = params;

    const [, { getOptics, getOpticsFromMapping }] = useOptic((mappedOptic ?? optic) as Optic<any[], mapped>, {
        denormalize: false,
    });

    const deriveOptics = getOptics ?? getOpticsFromMapping;

    return deriveOptics(getKey).map(([key, optic]) => cloneElement(children(optic, key), { key }));
}

export const For = typedMemo(_For);
