import { Optix, _Partial, _Total } from './lens';

function createCombinator<S, A, Args extends any[]>(
    f: (
        ...args: Args
    ) => {
        key: string;
        getOption: (s: S) => A | undefined;
        set: (a: A, s: S) => S;
    },
): (...args: Args) => Optix<A, _Partial, S>;
function createCombinator<S, A, Args extends any[]>(
    f: (
        ...args: Args
    ) => {
        key: string;
        get: (s: S) => A;
        set: (a: A, s: S) => S;
    },
): (...args: Args) => Optix<A, _Total, S>;
function createCombinator<Args extends any[]>(f: (...args: Args) => any) {
    return (...args: Args) => {
        const { set, key, get: _get, getOption } = f(...args);
        const get = _get || getOption;
        return new Optix([{ set, key, get }]);
    };
}

export const atIndex = createCombinator(<T>(index: number) => ({
    key: `at index ${index}`,
    get: (s: T[]) => s[index],
    set: (a: T, s: T[]) => {
        if (index < 0 || index > s.length - 1) return s;
        return [...s.slice(0, index), a, ...s.slice(index + 1)];
    },
}));

export function optix<T>(key = 'root'): Optix<T, _Total, T> {
    return new Optix([{ key, get: (s) => s, set: (a) => a }]);
}
