import { useCallback, useContext, useEffect, useState } from 'react';
import { Optix, partial } from '../lens';
import { StoreContext } from './createStore';

const useOptix = <T, TLensType extends partial>(optix: Optix<T, TLensType>) => {
    const { root, setRoot, subscriptions } = useContext(StoreContext);

    const [slice, setSlice] = useState(optix.get(root.ref));

    useEffect(() => {
        const subscription = (newRoot: any) => setSlice(optix.get(newRoot));
        subscriptions.add(subscription);
        return () => {
            subscriptions.delete(subscription);
        };
    }, []);

    const setter = useCallback((value: T | ((prevState: typeof slice) => T)) => {
        const newValue =
            typeof value !== 'function' ? value : (value as (prevState: typeof slice) => T)(optix.get(root.ref));
        setRoot(optix.set(newValue, root.ref));
    }, []);

    return [slice, setter] as [typeof slice, typeof setter];
};

export default useOptix;
