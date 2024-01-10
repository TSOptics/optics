import { ReduceValue } from './set';
import { FocusedValue, Lens, Modifiers } from './types';

export const get = <A, TModifiers extends Modifiers>(
    s: any,
    lenses: Lens[],
    cache?: { lenses: Map<Lens, any>; result?: FocusedValue<A, TModifiers> },
): FocusedValue<A, TModifiers> => {
    const rec = (s: any, lenses: Lens[], isTraversal = false): any => {
        const [lens, ...tailLenses] = lenses;
        if (!lens) {
            return s;
        }
        if (s === undefined || s === null) {
            const lensesFromMap = getLensesFromMap(lenses);
            return lensesFromMap ? rec([], lensesFromMap) : s;
        }
        if (cache && (lens.type === 'map' || lens.type === 'unstable')) {
            if (cache.result && cache.lenses.get(lens) === s) {
                return cache.result;
            }
            cache.lenses.set(lens, s);
        }
        if (lens.type === 'fold') {
            const fold: (ReduceValue | undefined) | ReduceValue[] = lens.get((s as any[]).map((x) => ({ value: x })));
            const isArray = Array.isArray(fold);
            if (cache && isArray) {
                if (cache.result && isFoldEqual(fold, cache.lenses.get(lens))) {
                    return cache.result;
                }
                cache.lenses.set(lens, fold);
            }

            return rec(isArray ? fold.map(({ value }) => value) : fold?.value, tailLenses, isArray);
        }
        if (lens.type === 'map') {
            const slice = lens.get(s) as any[];
            return rec(
                isTraversal ? slice.flat().filter((x) => x !== undefined && x !== null) : slice,
                tailLenses,
                true,
            );
        }
        const slice = isTraversal
            ? (s as any[]).filter((x) => x !== undefined && x !== null).map(lens.get)
            : lens.get(s);
        return rec(slice, tailLenses, isTraversal);
    };

    return rec(s, lenses);
};

const isFoldEqual = (fold: any, previousFold: any) => {
    if (!previousFold) {
        return false;
    }
    return (
        fold.length === previousFold.length &&
        fold.every((x: ReduceValue, i: number) => x.value === previousFold[i].value)
    );
};
const getLensesFromMap = (lenses: Lens[]): Lens[] | undefined => {
    const index = lenses.findIndex((lens) => lens.type === 'map');
    return index !== -1 ? lenses.slice(index) : undefined;
};
