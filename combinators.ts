import { Optional } from "./lens";

export function findFirst<T>(predicate: (t: T) => boolean): Optional<T[], T> {
    const getOption = (root: T[]) => root.find(predicate);
    
    const set = (x: T, root: T[]) => {
        const index = root.findIndex(predicate);
        if (index === -1) return root;
        return [...root.slice(0, index), x, ...root.slice(index + 1)]
    }

    return {getOption, set}
}