import { getFoldTree, isFold } from './fold';
import { Lens } from './types';

export const set = <A, S>(a: A | ((prev: A) => A), s: S, lenses: Lens[], foldTree = getFoldTree(lenses, s)): S => {
    const [lens, ...tailLenses] = lenses;
    if (!lens) return typeof a === 'function' ? (a as (prev: any) => A)(s) : (a as any);
    if (isFold(lens)) {
        return set(a, s, tailLenses);
    }
    const slice = lens.get(s);
    if ((slice === undefined || slice === null) && tailLenses.length > 0 && tailLenses[0].type !== 'partial') return s;
    if (lens.type === 'map') {
        const newSlice = foldTree
            ? (slice as any[]).map((x, index) => (foldTree[index] ? set(a, x, tailLenses, foldTree[index]) : x))
            : (slice as any[]).map((x) =>
                  tailLenses.length > 0 && (x === undefined || x === null) ? x : set(a, x, tailLenses, foldTree),
              );
        return (slice as any[]).some((x, i) => x !== newSlice[i]) ? lens.set(newSlice, s) : (s as any);
    }

    const newSlice = set(a, slice, tailLenses, foldTree);
    if (slice === newSlice) return s;
    return lens.set(newSlice, s);
};
