import { FocusedValue, Lens, OpticScope } from './types';

export const get = <A, TScope extends OpticScope>(
    s: any,
    lenses: Lens[],
    earlyReturn?: (s: any, lens: Lens) => any | undefined,
): FocusedValue<A, TScope> => {
    const rec = (s: any, lenses: Lens[], isTraversal = false): any => {
        const [lens, ...tailLenses] = lenses;
        if (!lens) {
            return s;
        }
        if (s === undefined || s === null) {
            const lensesFromMap = getLensesFromMap(lenses);
            return lensesFromMap ? rec([], lensesFromMap) : s;
        }
        const a = earlyReturn?.(s, lens);
        if (a !== undefined) {
            return a;
        }
        if (lens.type === 'fold') {
            const reduced = lens.get((s as any[]).map((x) => ({ value: x })));
            const isArray = Array.isArray(reduced);
            return rec(isArray ? reduced.map(({ value }) => value) : reduced?.value, tailLenses, isArray);
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

const getLensesFromMap = (lenses: Lens[]): Lens[] | undefined => {
    const index = lenses.findIndex((lens) => lens.type === 'map');
    return index !== -1 ? lenses.slice(index) : undefined;
};
