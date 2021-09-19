import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Optix, partial } from '../lens';
import { StoreContext } from './createStore';

const useOptix = <T, TLensType extends partial>(optix: Optix<T, TLensType>) => {
    const { root, setRoot, subscriptions } = useContext(StoreContext);

    const [slice, setSlice] = useState(optix.get(root.ref));

    const subscription = useCallback(
        (newRoot: any) => {
            setSlice(optix.get(newRoot));
        },
        [optix],
    );

    const subRef = useRef(subscription);

    // synchronize local state with the subscription
    if (subscription !== subRef.current) {
        subscription(root.ref);
        subRef.current = subscription;
    }

    // register subscription on mount (parent first)
    const mounted = useRef(false);
    if (!mounted.current) {
        subscriptions.add(subRef);
        mounted.current = true;
    }
    // unregister subscription on unmount (children first)
    useEffect(
        () => () => {
            subscriptions.delete(subRef);
        },
        [subscriptions],
    );

    const setter = useCallback(
        (value: T | ((prevState: typeof slice) => T)) => {
            const newValue =
                typeof value !== 'function' ? value : (value as (prevState: typeof slice) => T)(optix.get(root.ref));
            setRoot(optix.set(newValue, root.ref));
        },
        [optix, root, setRoot],
    );

    return [slice, setter] as [typeof slice, typeof setter];
};

export default useOptix;
