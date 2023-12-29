'use client';

import { GetOpticFocus, GetOpticScope, OpticScope, ReadOptic, Resolve, mapped, partial, total } from '@optics/state';
import React, { ReactElement, cloneElement, memo } from 'react';
import { useOptic } from './useOptic';

const typedMemo: <T>(c: T) => T = memo;

function _For<
    TOptic extends ReadOptic<TOpticFocus, OpticScope>,
    TMappedOptic extends ReadOptic<TMappedOpticFocus, mapped>,
    TOpticFocus extends any[] = GetOpticFocus<TOptic>,
    TMappedOpticFocus = GetOpticFocus<TMappedOptic>,
    TResolvedFocus = [TMappedOptic] extends [never] ? TOpticFocus[number] : TMappedOpticFocus,
    TResolvedOptic = [TMappedOptic] extends [never]
        ? Resolve<TOptic, TResolvedFocus, GetOpticScope<TOptic> extends partial ? total : mapped>
        : Resolve<TMappedOptic, TResolvedFocus, total>,
>(
    params: (
        | {
              optic: TOptic;
          }
        | {
              mappedOptic: TMappedOptic;
          }
    ) & {
        getKey: (t: TResolvedFocus) => string;
        children: (t: TResolvedOptic, key: string) => ReactElement;
    },
): JSX.Element {
    const { optic, mappedOptic, getKey, children } = params as any;

    const [, { getOptics, getOpticsFromMapping }] = useOptic((mappedOptic ?? optic) as ReadOptic<any[], mapped>, {
        denormalize: false,
    });

    const deriveOptics = getOptics ?? getOpticsFromMapping;

    return <>{deriveOptics(getKey).map(([key, optic]) => cloneElement(children(optic, key), { key }))}</>;
}

export const For = typedMemo(_For);
