import { pureOptic } from './pureOptic';

describe('map', () => {
    it('should handle consecutive calls to map', () => {
        type State = (number[] | undefined)[];
        const state: State = [[1, 2, 3], undefined, [4, 5, 6], undefined];
        const onNumbers = pureOptic<State>().map().map();
        expect(onNumbers.get(state)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(onNumbers.set((x) => x * 2, state)).toEqual([[2, 4, 6], undefined, [8, 10, 12], undefined]);
    });
    it('should focus undefined or null values', () => {
        const state = [32, undefined, 89, null, 1000];
        const onState = pureOptic<typeof state>().map();
        expect(onState.get(state)).toBe(state);
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
const onState = pureOptic<typeof state>();
const onItems = onState.playerList.map().inventory.map();
const onDurabilities = onItems.durability;
const onFires = onItems.enchantement.fire;

describe('fold', () => {
    it('should return the original root when calling set with the the same reference', () => {
        // map
        expect(onDurabilities.set((x) => x, state)).toBe(state);
        // fold
        expect(onDurabilities.findFirst((x) => x > 5).set((x) => x, state)).toBe(state);
        // fold to multiple
        expect(onDurabilities.filter((x) => x > 5).set((x) => x, state)).toBe(state);
    });
    it('should return the original root when calling set on a fold to nothing', () => {
        // fold
        expect(onDurabilities.findFirst((x) => x === 1000).set(42, state)).toBe(state);
        // fold to multiple
        expect(onDurabilities.filter((x) => x === 1000).set(42, state)).toBe(state);
    });
    it("should return empty array if a partial doesn't resolve", () => {
        // map
        const onNullableArray = pureOptic<number[] | undefined>().map();
        expect(onNullableArray.get(undefined)).toEqual([]);
        // fold to multiple
        expect(onNullableArray.filter((x) => x % 2 === 0).get(undefined)).toEqual([]);
    });
    it('should return empty array or undefined when folding to nothing', () => {
        // fold
        expect(onDurabilities.filter((x) => x === 1000).get(state)).toEqual([]);
        // fold to multiple
        expect(onDurabilities.findFirst((x) => x === 1000).get(state)).toBe(undefined);
    });
    it('findFirst', () => {
        const lowerThan10Durability = onDurabilities.findFirst((x) => x < 10);
        expect(lowerThan10Durability.get(state)).toBe(6);
        expect(lowerThan10Durability.get(lowerThan10Durability.set((x) => x + 10, state))).toBe(2);

        const onDurabilityOf2 = onDurabilities.findFirst((x) => x === 2);
        expect(onDurabilityOf2.get(onDurabilityOf2.set((x) => x + 1, state))).toBe(undefined);
    });
    it('max', () => {
        const onMaxDurability = onDurabilities.max();
        expect(onMaxDurability.get(state)).toBe(12);
        expect(onItems.max((item) => item.durability).get(state)).toMatchObject({ durability: 12, name: 'weapon1' });

        expect(onMaxDurability.get(onMaxDurability.set(0, state))).toBe(7);
    });
    it('min', () => {
        const onMinDurability = onDurabilities.min();
        expect(onMinDurability.get(state)).toBe(2);
        expect(onItems.min((item) => item.durability).get(state)).toMatchObject({ durability: 2, name: 'weapon3' });

        expect(onMinDurability.get(onMinDurability.set(1000, state))).toBe(6);
    });
    it('at', () => {
        expect(onDurabilities.at(3).get(state)).toBe(7);
        expect(onDurabilities.at(-3).get(state)).toBe(6);
        expect(onDurabilities.at(4).get(state)).toBe(undefined);
        expect(onDurabilities.at(-5).get(state)).toBe(undefined);
        expect(onDurabilities.get(onDurabilities.at(3).set(42, state))).toEqual([12, 6, 2, 42]);
    });
    it('filter', () => {
        const onEvenDurabilities = onDurabilities.filter((d) => d % 2 === 0);
        expect(onEvenDurabilities.get(state)).toEqual([12, 6, 2]);

        const newState = onEvenDurabilities.set((d) => d * 2, state);
        expect(onDurabilities.get(newState)).toEqual([24, 12, 4, 7]);
    });
    it('filter on consecutive maps', () => {
        const state: number[][] = [
            [1, 2, 3, 4, 9, 8],
            [5, 6, 7, 8],
            [12, 0],
        ];
        const onState = pureOptic<typeof state>();
        const onEvens = onState
            .map()
            .map()
            .filter((x) => x % 2 === 0);
        expect(onEvens.get(state)).toEqual([2, 4, 8, 6, 8, 12, 0]);
        expect(onState.get(onEvens.set(42, state))).toEqual([
            [1, 42, 3, 42, 9, 42],
            [5, 42, 7, 42],
            [42, 42],
        ]);
    });
    it('slice', () => {
        const onFirstTwo = onDurabilities.slice(0, 2);
        expect(onFirstTwo.get(state)).toEqual([12, 6]);

        const onNone = onDurabilities.slice(2, 1);
        expect(onNone.get(state)).toEqual([]);

        const onLastThree = onDurabilities.slice(-3);
        expect(onLastThree.get(state)).toEqual([6, 2, 7]);

        const onAll = onDurabilities.slice();
        expect(onAll.get(state)).toEqual([12, 6, 2, 7]);

        expect(onDurabilities.get(onLastThree.set((d) => d * 2, state))).toEqual([12, 12, 4, 14]);
    });
    describe('sort', () => {
        const onAscSort = onDurabilities.sort((a, b) => a - b);
        expect(onAscSort.get(state)).toEqual([2, 6, 7, 12]);

        const onDescSort = onDurabilities.sort((a, b) => b - a);
        expect(onDescSort.get(state)).toEqual([12, 7, 6, 2]);

        const onDefaultSort = onDurabilities.sort();
        expect(onDefaultSort.get(state)).toEqual([12, 2, 6, 7]);

        it('should put undefined values at the end', () => {
            const onFireSorted = onFires.sort();
            expect(onFireSorted.get(state)).toEqual([32, 54, undefined]);
        });
    });
});
