import { isFold } from './fold';
import isMapped from './isMapped';
import { FocusedValue, Lens, OpticScope } from './types';

export const get = <A, TScope extends OpticScope>(
    s: any,
    lenses: Lens[],
    earlyReturn?: (s: any, lens: Lens) => any | undefined,
): FocusedValue<A, TScope> => {
    const aux = (s: any, lenses: Lens[], isTraversal = false): any => {
        const [lens, ...tailLenses] = lenses;
        if (!lens || s === undefined || s === null) {
            return s;
        }
        const a = earlyReturn?.(s, lens);
        if (a !== undefined) {
            return a;
        }
        if (lens.type === 'map') {
            const slice = lens.get(s) as any[];
            const flattened = isTraversal ? slice.flat() : slice;
            const filtered =
                tailLenses[0] && !isFold(tailLenses[0])
                    ? flattened.filter((x) => x !== undefined && x !== null)
                    : flattened;
            const result = filtered.length > 0 ? aux(filtered, tailLenses, true) : undefined;
            return result;
        }
        if (lens.type === 'fold') {
            const index: number = lens.get(s);
            if (index === -1) return undefined;
            return aux((s as any[])[index], tailLenses, false);
        }
        if (lens.type === 'foldN') {
            const indexes: number[] = lens.get(s);
            if (indexes.length === 0) return [];
            const projection = Array(indexes.length)
                .fill(undefined)
                .map((_, i) => s[indexes[i]]);
            return aux(projection, tailLenses, true);
        }
        if (isTraversal) {
            const slice = (s as any[]).map(lens.get);
            const filtered = !isFold(tailLenses[0]) ? slice.filter((x) => x !== undefined && x !== null) : slice;
            return filtered.length > 0 ? aux(filtered, tailLenses, isTraversal) : undefined;
        }
        const slice = lens.get(s);
        return aux(slice, tailLenses, isTraversal);
    };

    const result = aux(s, lenses);
    return (result === undefined || result === null) && isMapped(lenses) ? [] : result;
};
