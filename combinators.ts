import { Lens } from './lens';

export function findFirst<T>(predicate: (t: T) => boolean): Lens<T[], T | undefined> {
    const get = (root: T[]) => root.find(predicate);

    const set = (x: T | undefined, root: T[]) => {
        const index = root.findIndex(predicate);
        if (index === -1 || x === undefined) return root;
        return [...root.slice(0, index), x, ...root.slice(index + 1)];
    };

    return { get, set };
}
