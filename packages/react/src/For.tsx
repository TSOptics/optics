'use client';

import { GetOpticFocus, ReadOptic, Resolve, deriveOptics, partial, total } from '@optics/state';
import React, { ReactElement, cloneElement, memo, useMemo } from 'react';
import { useOptic } from './useOptic';

const typedMemo: <T>(c: T) => T = memo;

type Props<TOptic extends ReadOptic<T, partial>, T extends any[] = GetOpticFocus<TOptic>> = {
    optic: TOptic;
    getKey: (t: T[number]) => string;
    children: (t: Resolve<TOptic, T[number], total>, key: string) => ReactElement;
};

export const For = typedMemo(
    <TOptic extends ReadOptic<T, partial>, T extends any[] = GetOpticFocus<TOptic>>({
        optic,
        getKey,
        children,
    }: Props<TOptic, T>) => {
        const derivedOpticsOptic = useMemo(() => deriveOptics<TOptic, T>({ optic, getKey }), [optic]);

        const [optics = []] = useOptic(derivedOpticsOptic, { denormalize: false });

        return <>{optics.map(([key, optic]) => cloneElement(children(optic as any, key), { key }))}</>;
    },
);
