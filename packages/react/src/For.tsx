'use client';

import {
    GetOpticFocus,
    GetOpticScope,
    OpticScope,
    ReadOptic,
    Resolve,
    opticsFromKey,
    opticsFromKeyMapped,
    mapped,
    partial,
    total,
} from '@optics/state';
import React, { ReactElement, cloneElement, memo, useMemo } from 'react';
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

    const deriveOptics = useMemo(
        () =>
            mappedOptic
                ? opticsFromKeyMapped<ReadOptic<any, mapped>>({ optic: mappedOptic, getKey: getKey })
                : opticsFromKey<ReadOptic<any[], partial>>({ optic, getKey: getKey }),
        [mappedOptic, optic],
    );

    useOptic(mappedOptic ?? optic, { denormalize: false });

    const derivedOptics = deriveOptics();

    return <>{derivedOptics.map(([key, optic]) => cloneElement(children(optic, key), { key }))}</>;
}

export const For = typedMemo(_For);
