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

export const isObject = (obj: unknown): obj is Record<string, unknown> => typeof obj === 'object' && obj !== null;

export const noop = () => {
    //
};
