import { Lens } from "./lens";

function combineLenses<T, U, R>(l1: Lens<T, U>, l2: Lens<U, R>): Lens<T, R> {
    return {
        get: (root) => l2.get(l1.get(root)),
        set: (x, root) => 
            l1.set(l2.set(x, l1.get(root)), root)
    }
}

function modify<T, R>(lens: Lens<T, R>, f: (r: R) => R, root: T) {
    return lens.set(f(lens.get(root)), root);
}

function stabilize<T extends any[], R>(f: (...args: T) => R) {
    let lastArgs: T | null = null;
    let lastResult: R | null = null;

    return (...args: T) => {
        if (args.every((x, i) => x === lastArgs?.[i])) {
            return lastResult;
        }
        lastArgs = args;
        lastResult = f(...args);
        return lastResult;
    }
}

const f = stabilize((a: string, b: number) => a);

f('yolo', 42);
f('yolo', 42);
f('yolo', 32);
f('swag', 42);
f('yolo', 42);
