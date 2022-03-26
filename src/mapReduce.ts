import { Lens } from './types';

type FoldGroup = {
    openingTraversal: Lens;
    reduce: Lens;
};

export const getFoldGroups = (lenses: Lens[], openingTraversal?: Lens): FoldGroup[] => {
    const [hd, ...tl] = lenses;
    if (!hd) {
        return [];
    }
    if (hd.type === 'reduced' && openingTraversal) {
        return [{ openingTraversal, reduce: hd }, ...getFoldGroups(tl)];
    }
    if (hd.type === 'mapped' && !openingTraversal) {
        return getFoldGroups(tl, hd);
    }
    return getFoldGroups(tl, openingTraversal);
};

const partialSymbol = Symbol('partial');
export const getElemsWithPath = (s: any, lenses: Lens[]) => {
    const aux = (s: any, lenses: Lens[], path: number[] = []): ([number[], any] | typeof partialSymbol)[] => {
        const [hd, ...tl] = lenses;
        if (!hd || hd.type === 'reduced') {
            return [[path, s]];
        }
        const slice = hd.get(s);
        if (slice === null || slice === undefined) {
            return [partialSymbol];
        }
        if (!hd.type) {
            return aux(slice, tl, path);
        }
        return (slice as any[]).flatMap((x, index) => aux(x, tl, [...path, index]));
    };

    return aux(s, lenses).filter((x) => x !== partialSymbol) as [number[], any][];
};

const focusIndex = (index: number): Lens<any, any[]> => ({
    get: (s) => s[index],
    set: (a, s) => [...s.slice(0, index), a, ...s.slice(index + 1)],
    key: '',
});

export const replaceTraversals = (lenses: Lens[], indexesPath: number[]): Lens[] => {
    const [hdIndexes, ...tlIndexes] = indexesPath;
    const [hdLenses, ...tlLenses] = lenses;
    if (hdLenses.type === 'mapped') {
        return [focusIndex(hdIndexes), ...replaceTraversals(tlLenses, tlIndexes)];
    }
    if (hdLenses.type === 'reduced') {
        return tlLenses;
    }
    return [hdLenses, ...replaceTraversals(tlLenses, indexesPath)];
};
