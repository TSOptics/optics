import { pureOptic } from './pureOpticConstructor';

describe('map', () => {
    it('should handle consecutive calls to map', () => {
        type State = (number[] | undefined)[];
        const state: State = [[1, 2, 3], undefined, [4, 5, 6], undefined];
        const numbersOptic = pureOptic<State>().map().map();
        expect(numbersOptic.get(state)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(numbersOptic.set((x) => x * 2, state)).toEqual([[2, 4, 6], undefined, [8, 10, 12], undefined]);
    });
    it('should focus undefined or null values', () => {
        const state = [32, undefined, 89, null, 1000];
        const stateOptic = pureOptic<typeof state>().map();
        expect(stateOptic.get(state)).toBe(state);
    });
});

const state: {
    playerList: {
        name: string;
        inventory: { name: string; durability: number; enchantement?: { fire?: number } }[];
    }[];
} = {
    playerList: [
        {
            name: 'player1',
            inventory: [
                { name: 'weapon1', durability: 12, enchantement: { fire: 32 } },
                { name: 'weapon2', durability: 6, enchantement: { fire: undefined } },
            ],
        },
        {
            name: 'player2',
            inventory: [
                { name: 'weapon3', durability: 2 },
                { name: 'weapon4', durability: 7, enchantement: { fire: 54 } },
            ],
        },
    ],
};
const stateOptic = pureOptic<typeof state>();
const itemsOptic = stateOptic.playerList.map().inventory.map();
const durabilitiesOptic = itemsOptic.durability;
const firesOptic = itemsOptic.enchantement.fire;

describe('fold', () => {
    it('should return the original root when calling set with the the same reference', () => {
        // map
        expect(durabilitiesOptic.set((x) => x, state)).toBe(state);
        // fold
        expect(durabilitiesOptic.reduceFindFirst((x) => x > 5).set((x) => x, state)).toBe(state);
        // fold to multiple
        expect(durabilitiesOptic.reduceFilter((x) => x > 5).set((x) => x, state)).toBe(state);
    });
    it('should return the original root when calling set on a fold to nothing', () => {
        // fold
        expect(durabilitiesOptic.reduceFindFirst((x) => x === 1000).set(42, state)).toBe(state);
        // fold to multiple
        expect(durabilitiesOptic.reduceFilter((x) => x === 1000).set(42, state)).toBe(state);
    });
    it("should return empty array if a partial doesn't resolve", () => {
        // map
        const nullableArrayOptic = pureOptic<number[] | undefined>().map();
        expect(nullableArrayOptic.get(undefined)).toEqual([]);
        // fold to multiple
        expect(nullableArrayOptic.reduceFilter((x) => x % 2 === 0).get(undefined)).toEqual([]);
    });
    it('should return empty array or undefined when folding to nothing', () => {
        // fold
        expect(durabilitiesOptic.reduceFilter((x) => x === 1000).get(state)).toEqual([]);
        // fold to multiple
        expect(durabilitiesOptic.reduceFindFirst((x) => x === 1000).get(state)).toBe(undefined);
    });
    it('findFirst', () => {
        const lowerThan10Durability = durabilitiesOptic.reduceFindFirst((x) => x < 10);
        expect(lowerThan10Durability.get(state)).toBe(6);
        expect(lowerThan10Durability.get(lowerThan10Durability.set((x) => x + 10, state))).toBe(2);

        const durabilityOf2Optic = durabilitiesOptic.reduceFindFirst((x) => x === 2);
        expect(durabilityOf2Optic.get(durabilityOf2Optic.set((x) => x + 1, state))).toBe(undefined);
    });
    describe('reduceMax', () => {
        const maxDurabilityOptic = durabilitiesOptic.reduceMax();
        it('should reduce on the max value', () => {
            expect(maxDurabilityOptic.get(state)).toBe(12);
            expect(itemsOptic.reduceMax((item) => item.durability).get(state)).toMatchObject({
                durability: 12,
                name: 'weapon1',
            });

            const newState = maxDurabilityOptic.set(0, state);
            expect(maxDurabilityOptic.get(newState)).toBe(7);
        });
        it('should use the custom number getter if provided', () => {
            const mostDurableItemOptic = itemsOptic.reduceMax((item) => item.durability);
            expect(mostDurableItemOptic.get(state)).toEqual({
                name: 'weapon1',
                durability: 12,
                enchantement: { fire: 32 },
            });

            const newState = mostDurableItemOptic.set({ name: 'cursed weapon', durability: 0 }, state);
            expect(mostDurableItemOptic.get(newState)).toEqual({
                name: 'weapon4',
                durability: 7,
                enchantement: { fire: 54 },
            });
        });
    });
    describe('min', () => {
        it('should reduce on the min value', () => {
            const minDurabilityOptic = durabilitiesOptic.reduceMin();
            expect(minDurabilityOptic.get(state)).toBe(2);
            expect(itemsOptic.reduceMin((item) => item.durability).get(state)).toMatchObject({
                durability: 2,
                name: 'weapon3',
            });

            const newState = minDurabilityOptic.set(1000, state);
            expect(minDurabilityOptic.get(newState)).toBe(6);
        });
        it('should use the custom number getter if provided', () => {
            const leastDurableItemOptic = itemsOptic.reduceMin((item) => item.durability);
            expect(leastDurableItemOptic.get(state)).toEqual({
                name: 'weapon3',
                durability: 2,
            });

            const newState = leastDurableItemOptic.set({ name: 'legendary weapon', durability: 1000 }, state);
            expect(leastDurableItemOptic.get(newState)).toEqual({
                name: 'weapon2',
                durability: 6,
                enchantement: { fire: undefined },
            });
        });
    });
    it('at', () => {
        expect(durabilitiesOptic.reduceAt(3).get(state)).toBe(7);
        expect(durabilitiesOptic.reduceAt(-3).get(state)).toBe(6);
        expect(durabilitiesOptic.reduceAt(4).get(state)).toBe(undefined);
        expect(durabilitiesOptic.reduceAt(-5).get(state)).toBe(undefined);
        expect(durabilitiesOptic.get(durabilitiesOptic.reduceAt(3).set(42, state))).toEqual([12, 6, 2, 42]);
    });
    it('filter', () => {
        const evenDurabilitiesOptic = durabilitiesOptic.reduceFilter((d) => d % 2 === 0);
        expect(evenDurabilitiesOptic.get(state)).toEqual([12, 6, 2]);

        const newState = evenDurabilitiesOptic.set((d) => d * 2, state);
        expect(durabilitiesOptic.get(newState)).toEqual([24, 12, 4, 7]);
    });
    it('filter on consecutive maps', () => {
        const state: number[][] = [
            [1, 2, 3, 4, 9, 8],
            [5, 6, 7, 8],
            [12, 0],
        ];
        const stateOptic = pureOptic<typeof state>();
        const evensOptic = stateOptic
            .map()
            .map()
            .reduceFilter((x) => x % 2 === 0);
        expect(evensOptic.get(state)).toEqual([2, 4, 8, 6, 8, 12, 0]);
        expect(stateOptic.get(evensOptic.set(42, state))).toEqual([
            [1, 42, 3, 42, 9, 42],
            [5, 42, 7, 42],
            [42, 42],
        ]);
    });
    it('slice', () => {
        const firstTwoOptic = durabilitiesOptic.reduceSlice(0, 2);
        expect(firstTwoOptic.get(state)).toEqual([12, 6]);

        const noneOptic = durabilitiesOptic.reduceSlice(2, 1);
        expect(noneOptic.get(state)).toEqual([]);

        const lastThreeOptic = durabilitiesOptic.reduceSlice(-3);
        expect(lastThreeOptic.get(state)).toEqual([6, 2, 7]);

        const allOptic = durabilitiesOptic.reduceSlice();
        expect(allOptic.get(state)).toEqual([12, 6, 2, 7]);

        expect(durabilitiesOptic.get(lastThreeOptic.set((d) => d * 2, state))).toEqual([12, 12, 4, 14]);
    });
    describe('sort', () => {
        const ascSortOptic = durabilitiesOptic.reduceSort((a, b) => a - b);
        expect(ascSortOptic.get(state)).toEqual([2, 6, 7, 12]);

        const descSortOptic = durabilitiesOptic.reduceSort((a, b) => b - a);
        expect(descSortOptic.get(state)).toEqual([12, 7, 6, 2]);

        const defaultSortOptic = durabilitiesOptic.reduceSort();
        expect(defaultSortOptic.get(state)).toEqual([12, 2, 6, 7]);

        it('should put undefined values at the end', () => {
            const fireSortedOptic = firesOptic.reduceSort();
            expect(fireSortedOptic.get(state)).toEqual([32, 54, undefined]);
        });
    });
});
