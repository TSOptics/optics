import { Lens } from './types';

export const getNextFold = (lenses: Lens[]) => lenses.find((lens) => lens.type === 'fold');

export const getElemsWithPath = (s: any, lenses: Lens[]) => {
    const aux = (s: any, lenses: Lens[], path: number[] = []): [number[], any][] => {
        const [lens, ...tailLenses] = lenses;
        if (!lens || lens.type === 'fold') {
            return [[path, s]];
        }
        const slice = lens.get(s);
        if ((slice === null || slice === undefined) && tailLenses[0].type !== 'fold') {
            return [];
        }
        if (!lens.type) {
            return aux(slice, tailLenses, path);
        }
        return (slice as any[]).flatMap((x, index) => aux(x, tailLenses, [...path, index]));
    };

    return aux(s, lenses);
};

const focusIndex = (index: number): Lens<any, any[]> => ({
    get: (s) => s[index],
    set: (a, s) => [...s.slice(0, index), a, ...s.slice(index + 1)],
    key: '',
});

export const replaceTraversals = (lenses: Lens[], path: number[]): Lens[] => {
    const [index, ...tailPath] = path;
    const [lens, ...tailLenses] = lenses;
    if (lens.type === 'mapped') {
        return [focusIndex(index), ...replaceTraversals(tailLenses, tailPath)];
    }
    if (lens.type === 'fold') {
        return lenses;
    }
    return [lens, ...replaceTraversals(tailLenses, path)];
};
