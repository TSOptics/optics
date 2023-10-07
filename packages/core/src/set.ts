import { Lens } from './types';

const contSymbol: unique symbol = Symbol('cont');
type Continuation = (s: any) => void;

export type ReduceValue<T = any> = { readonly value: T; [contSymbol]: Continuation };

export const set = <A, S>(a: A | ((prev: A) => A), s: S, lenses: Lens[]): S => {
    const setWithCont = <A, S>(s: S, lenses: Lens[], cont: Continuation): void => {
        const rec = (s: any, lenses: Lens[], cont: Continuation): void => {
            const [lens, ...tailLenses] = lenses;
            if (!lens) {
                return cont(typeof a === 'function' ? (a as (prev: any) => A)(s) : (a as any));
            }
            if (lens.type === 'fold') {
                reduceData.lenses = lenses;
                reduceData.values.push({ value: s, [contSymbol]: cont });
                return;
            }
            const slice = lens.get(s);
            if ((slice === undefined || slice === null) && tailLenses.length > 0) return;
            if (lens.type === 'map') {
                const newArray = [...slice];
                (slice as any[]).forEach((elem, i) => {
                    if ((elem !== undefined && elem !== null) || tailLenses.length === 0) {
                        rec(elem, tailLenses, (newElem) => (newArray[i] = newElem));
                    }
                });
                const callCont = () => cont(newArray.some((elem, i) => elem !== slice[i]) ? newArray : slice);
                reduceData.values.length > 0 ? reduceData.mappedConts.push(callCont) : callCont();
                return;
            }
            rec(slice, tailLenses, (newSlice) => cont(newSlice === slice ? s : lens.set(newSlice, s)));
        };

        const reduceData: ReduceData = {
            values: [],
            lenses: [],
            mappedConts: [],
        };

        rec(s, lenses, cont);
        if (reduceData.values.length > 0) {
            reduce(reduceData);
        }
    };

    type ReduceData = { values: ReduceValue[]; lenses: Lens[]; mappedConts: (() => void)[] };
    const reduce = ({ values, lenses: [reduceLens, ...tailLenses], mappedConts }: ReduceData) => {
        const reduced: ReduceValue[] | (ReduceValue | undefined) = reduceLens.get(values);
        if (!reduced) return;
        (Array.isArray(reduced) ? reduced : [reduced]).forEach(({ value, [contSymbol]: cont }) => {
            setWithCont(value, tailLenses, cont);
        });
        mappedConts.forEach((cont) => cont());
    };

    let result = s;
    setWithCont(s, lenses, (_result) => (result = _result));
    return result;
};
