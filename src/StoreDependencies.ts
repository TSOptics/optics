export type StoreDependencies<T = null> =
    | Array<StoreDependencies | undefined>
    | { [key: string]: StoreDependencies }
    | T;

export const stateDependenciesMap = <T, R>(
    state: any,
    storeDependencies: StoreDependencies,
    f: (leaf: T) => R,
): StoreDependencies<R> => {
    const stack: [state: any, tree: any][] = [[state, storeDependencies]];
    const resultStack: any[] = [Array.isArray(storeDependencies) ? [] : {}];
    const result = resultStack[0];
    while (stack.length > 0) {
        const [[state, tree]] = stack.splice(stack.length - 1, 1);
        const resultElem = resultStack.splice(resultStack.length - 1, 1)[0];
        Object.keys(tree).forEach((key) => {
            const stateValue = state[key];
            if (tree[key] === null) {
                resultElem[key] = f(stateValue);
            } else {
                resultElem[key] = Array.isArray(stateValue) ? [...stateValue] : { ...stateValue };
                stack.push([stateValue, tree[key]]);
                resultStack.push(resultElem[key]);
            }
        });
    }
    return result;
};

export const treeForEach = <T>(storeDependencies: StoreDependencies<T>, f: (leaf: T) => void): void => {
    const stack: any[] = [storeDependencies];
    while (stack.length > 0) {
        const [elem] = stack.splice(stack.length - 1, 1);
        if (typeof elem !== 'object') {
            f(elem);
        } else {
            Object.values(elem).forEach((v) => {
                stack.push(v as any);
            });
        }
    }
};
