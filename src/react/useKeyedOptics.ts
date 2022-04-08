import { useCallback, useContext, useRef } from 'react';
import { Optic } from '../Optic';
import { Lens, OpticType } from '../types';
import { noop } from '../utils';
import { rootOpticSymbol, Store, Stores } from './createStore';
import { OpticsStoresContext } from './provider';

type KeyedOptics<T, TOpticType extends OpticType, S> = Record<string, Optic<T, TOpticType, S>>;

const useKeyedOptics = <T, TOpticType extends OpticType, S>(
    onArray: Optic<T[], TOpticType>,
    keyExtractor: (t: T) => string,
) => {
    const stores = useContext(OpticsStoresContext);

    const storeLens = onArray.ˍˍunsafeGetLenses()[0];
    if (storeLens.key !== rootOpticSymbol) {
        throw new Error("This optic isn't linked to a store");
    }

    const store = storeLens.get(stores) as Store;

    const keyExtractorRef = useRef(keyExtractor).current;

    const keyedOptics = useRef<KeyedOptics<T, TOpticType, S>>({});
    const listener = (stores: Stores) => {
        const array: any[] | undefined = onArray.get(stores);
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
                    const lenses = opticForKey.ˍˍunsafeGetLenses();
                    lenses[lenses.length - 1] = lensOnIndex;
                    acc[key] = opticForKey;
                } else {
                    acc[key] = onArray.compose(new Optic([lensOnIndex])) as any;
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
        unsubscribe.current = store.subscribe(listener);
        listener(stores);
    }

    const getOpticFromKey = useCallback((key: string) => keyedOptics.current[key], [keyedOptics]);

    return getOpticFromKey;
};

export default useKeyedOptics;
