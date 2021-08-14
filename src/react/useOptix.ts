import { useCallback, useContext, useEffect, useState } from 'react';
import { Optix, partial, total } from '../lens';
import { StoreContext } from './createStore';

type Focus<T, TLensType extends partial> = TLensType extends total ? T : T | undefined;
type EqualityFn<T, TLensType extends partial> = (
    oldValue: Focus<T, TLensType>,
    newValue: Focus<T, TLensType>,
) => boolean;

const useOptix = <T, TLensType extends partial>(optix: Optix<T, TLensType>, equalityFn?: EqualityFn<T, TLensType>) => {
    const { root, setRoot, subscriptions } = useContext(StoreContext);

    const [slice, setSlice] = useState(optix.get(root.ref));

    useEffect(() => {
        const subscription = (newRoot: any) =>
            setSlice((oldSlice) => {
                const newSlice = optix.get(newRoot);
                return !equalityFn || !equalityFn(oldSlice, newSlice) ? newSlice : oldSlice;
            });
        subscriptions.add(subscription);
        return () => {
            subscriptions.delete(subscription);
        };
    }, [optix, subscriptions, equalityFn]);

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
