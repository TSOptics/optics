export const memoize = <T, R>(f: (arg: T) => R): ((arg: T) => R) => {
    const cache = new Map<T, R>();
    return (arg: T): R => {
        const cached = cache.get(arg);
        if (cached) {
            return cached;
        }
        const returnValue = f(arg);
        cache.set(arg, returnValue);
        return returnValue;
    };
};
