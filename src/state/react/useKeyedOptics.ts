import { useCallback, useRef } from 'react';
import PureOpticImpl from '../../PureOptic.impl';
import { Lens, OpticType } from '../../types';
import { noop } from '../../utils';
import { Optic } from '../Optic.types';

type KeyedOptics<T, TOpticType extends OpticType, S> = Record<string, Optic<T, TOpticType, S>>;

const useKeyedOptics = <T, TOpticType extends OpticType, S>(
    onArray: Optic<T[], TOpticType, S>,
    keyExtractor: (t: T) => string,
) => {
    const keyExtractorRef = useRef(keyExtractor).current;

    const keyedOptics = useRef<KeyedOptics<T, TOpticType, S>>({});
    const listener = (array: any[] | undefined) => {
        keyedOptics.current =
            array?.reduce<KeyedOptics<T, TOpticType, S>>((acc, cv, ci) => {
                const key = keyExtractorRef(cv);
                const lensOnIndex: Lens<T, T[]> = {
                    get: (s) => s[ci],
                    set: (a, s) => [...s.slice(0, ci), a, ...s.slice(ci + 1)],
                    key: 'focus ' + ci,
                };
                const opticForKey = keyedOptics.current[key];
                if (opticForKey) {
                    const lenses = (opticForKey as any)['lenses'];
                    lenses[lenses.length - 1] = lensOnIndex;
                    acc[key] = opticForKey;
                } else {
                    acc[key] = onArray.compose(new PureOpticImpl<any, OpticType, T[]>([lensOnIndex])) as any;
                }
                return acc;
            }, {}) ?? {};
    };

    const unsubscribe = useRef<() => void>(noop);
    const opticRef = useRef<typeof onArray>();

    if (onArray !== opticRef.current) {
        keyedOptics.current = {};
        opticRef.current = onArray;
        unsubscribe.current();
        unsubscribe.current = onArray.subscribe(listener);
        listener(onArray.get());
    }

    const getOpticFromKey = useCallback((key: string) => keyedOptics.current[key], [keyedOptics]);

    return getOpticFromKey;
};

export default useKeyedOptics;
