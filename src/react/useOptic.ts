import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Optic, partial } from '..';
import { StoreContext } from './createStore';

const useOptic = <T, TLensType extends partial>(optic: Optic<T, TLensType>) => {
    const { root, setRoot, subscriptions } = useContext(StoreContext);

    const [slice, setSlice] = useState(optic.get(root.ref));

    const subscription = useCallback(
        (newRoot: any) => {
            setSlice(optic.get(newRoot));
        },
        [optic],
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
                typeof value !== 'function' ? value : (value as (prevState: typeof slice) => T)(optic.get(root.ref));
            setRoot(optic.set(newValue, root.ref));
        },
        [optic, root, setRoot],
    );

    return [slice, setter] as [typeof slice, typeof setter];
};

export default useOptic;
