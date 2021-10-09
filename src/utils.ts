export const stabilize = <T, R>(f: (arg: T) => R) => {
    let latestArg: T;
    let latestReturn: R;
    return (arg: T) => {
        if (arg === latestArg) return latestReturn;
        latestReturn = f(arg);
        latestArg = arg;
        return latestReturn;
    };
};

export const noop = () => {
    //
};
