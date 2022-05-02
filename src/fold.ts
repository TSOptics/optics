import { Lens } from './types';

type IndexTree = IndexTree[] | number;
type FoldTree = FoldTree[] | undefined;

export const isFold = (lens?: Lens) => lens && (lens.type === 'fold' || lens.type === 'foldMultiple');

const filterIndexTree = (indexTree: IndexTree, indexes: Set<number>) => {
    const aux = (indexTree: IndexTree): FoldTree => {
        if (typeof indexTree === 'number') {
            return indexes.has(indexTree) ? [] : undefined;
        }
        let isEmpty = true;
        const foldTree = indexTree.map((subTree) => {
            const filtered = aux(subTree);
            if (filtered !== undefined) isEmpty = false;
            return filtered;
        });
        return isEmpty ? undefined : foldTree;
    };
    return aux(indexTree);
};

export const getFoldTree = (lenses: Lens[], s: any) => {
    const fold = lenses.find(isFold);
    if (!fold) return;
    const array: any[] = [];
    const getIndexTree = (lenses: Lens[], s: any): IndexTree => {
        const [lens, ...tailLenses] = lenses;
        if (lens === fold) {
            const index = array.length;
            array.push(s);
            return index;
        }
        const slice = lens.get(s);
        if ((slice === undefined || slice === null) && !isFold(tailLenses[0])) {
            return -1;
        }
        if (lens.type === 'mapped') {
            return (slice as any[]).reduce<IndexTree[]>((acc, cv) => {
                const subTree = getIndexTree(tailLenses, cv);
                if (subTree !== -1) {
                    acc.push(subTree);
                }
                return acc;
            }, []);
        }
        return getIndexTree(tailLenses, slice);
    };
    const indexTree = getIndexTree(lenses, s);
    const foldReturn: number | number[] = fold.get(array);
    const validIndexes = new Set(Array.isArray(foldReturn) ? foldReturn : [foldReturn]);
    return filterIndexTree(indexTree, validIndexes);
};
