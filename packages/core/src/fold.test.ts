import { pureOptic } from './pureOpticConstructor';

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
        expect(onDurabilities.reduceFindFirst((x) => x > 5).set((x) => x, state)).toBe(state);
        // fold to multiple
        expect(onDurabilities.reduceFilter((x) => x > 5).set((x) => x, state)).toBe(state);
    });
    it('should return the original root when calling set on a fold to nothing', () => {
        // fold
        expect(onDurabilities.reduceFindFirst((x) => x === 1000).set(42, state)).toBe(state);
        // fold to multiple
        expect(onDurabilities.reduceFilter((x) => x === 1000).set(42, state)).toBe(state);
    });
    it("should return empty array if a partial doesn't resolve", () => {
        // map
        const onNullableArray = pureOptic<number[] | undefined>().map();
        expect(onNullableArray.get(undefined)).toEqual([]);
        // fold to multiple
        expect(onNullableArray.reduceFilter((x) => x % 2 === 0).get(undefined)).toEqual([]);
    });
    it('should return empty array or undefined when folding to nothing', () => {
        // fold
        expect(onDurabilities.reduceFilter((x) => x === 1000).get(state)).toEqual([]);
        // fold to multiple
        expect(onDurabilities.reduceFindFirst((x) => x === 1000).get(state)).toBe(undefined);
    });
    it('findFirst', () => {
        const lowerThan10Durability = onDurabilities.reduceFindFirst((x) => x < 10);
        expect(lowerThan10Durability.get(state)).toBe(6);
        expect(lowerThan10Durability.get(lowerThan10Durability.set((x) => x + 10, state))).toBe(2);

        const onDurabilityOf2 = onDurabilities.reduceFindFirst((x) => x === 2);
        expect(onDurabilityOf2.get(onDurabilityOf2.set((x) => x + 1, state))).toBe(undefined);
    });
    describe('reduceMax', () => {
        const onMaxDurability = onDurabilities.reduceMax();
        it('should reduce on the max value', () => {
            expect(onMaxDurability.get(state)).toBe(12);
            expect(onItems.reduceMax((item) => item.durability).get(state)).toMatchObject({
                durability: 12,
                name: 'weapon1',
            });

            const newState = onMaxDurability.set(0, state);
            expect(onMaxDurability.get(newState)).toBe(7);
        });
        it('should use the custom number getter if provided', () => {
            const onMostDurableItem = onItems.reduceMax((item) => item.durability);
            expect(onMostDurableItem.get(state)).toEqual({
                name: 'weapon1',
                durability: 12,
                enchantement: { fire: 32 },
            });

            const newState = onMostDurableItem.set({ name: 'cursed weapon', durability: 0 }, state);
            expect(onMostDurableItem.get(newState)).toEqual({
                name: 'weapon4',
                durability: 7,
                enchantement: { fire: 54 },
            });
        });
    });
    describe('min', () => {
        it('should reduce on the min value', () => {
            const onMinDurability = onDurabilities.reduceMin();
            expect(onMinDurability.get(state)).toBe(2);
            expect(onItems.reduceMin((item) => item.durability).get(state)).toMatchObject({
                durability: 2,
                name: 'weapon3',
            });

            const newState = onMinDurability.set(1000, state);
            expect(onMinDurability.get(newState)).toBe(6);
        });
        it('should use the custom number getter if provided', () => {
            const onLeastDurableItem = onItems.reduceMin((item) => item.durability);
            expect(onLeastDurableItem.get(state)).toEqual({
                name: 'weapon3',
                durability: 2,
            });

            const newState = onLeastDurableItem.set({ name: 'legendary weapon', durability: 1000 }, state);
            expect(onLeastDurableItem.get(newState)).toEqual({
                name: 'weapon2',
                durability: 6,
                enchantement: { fire: undefined },
            });
        });
    });
    it('at', () => {
        expect(onDurabilities.reduceAt(3).get(state)).toBe(7);
        expect(onDurabilities.reduceAt(-3).get(state)).toBe(6);
        expect(onDurabilities.reduceAt(4).get(state)).toBe(undefined);
        expect(onDurabilities.reduceAt(-5).get(state)).toBe(undefined);
        expect(onDurabilities.get(onDurabilities.reduceAt(3).set(42, state))).toEqual([12, 6, 2, 42]);
    });
    it('filter', () => {
        const onEvenDurabilities = onDurabilities.reduceFilter((d) => d % 2 === 0);
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
            .reduceFilter((x) => x % 2 === 0);
        expect(onEvens.get(state)).toEqual([2, 4, 8, 6, 8, 12, 0]);
        expect(onState.get(onEvens.set(42, state))).toEqual([
            [1, 42, 3, 42, 9, 42],
            [5, 42, 7, 42],
            [42, 42],
        ]);
    });
    it('slice', () => {
        const onFirstTwo = onDurabilities.reduceSlice(0, 2);
        expect(onFirstTwo.get(state)).toEqual([12, 6]);

        const onNone = onDurabilities.reduceSlice(2, 1);
        expect(onNone.get(state)).toEqual([]);

        const onLastThree = onDurabilities.reduceSlice(-3);
        expect(onLastThree.get(state)).toEqual([6, 2, 7]);

        const onAll = onDurabilities.reduceSlice();
        expect(onAll.get(state)).toEqual([12, 6, 2, 7]);

        expect(onDurabilities.get(onLastThree.set((d) => d * 2, state))).toEqual([12, 12, 4, 14]);
    });
    describe('sort', () => {
        const onAscSort = onDurabilities.reduceSort((a, b) => a - b);
        expect(onAscSort.get(state)).toEqual([2, 6, 7, 12]);

        const onDescSort = onDurabilities.reduceSort((a, b) => b - a);
        expect(onDescSort.get(state)).toEqual([12, 7, 6, 2]);

        const onDefaultSort = onDurabilities.reduceSort();
        expect(onDefaultSort.get(state)).toEqual([12, 2, 6, 7]);

        it('should put undefined values at the end', () => {
            const onFireSorted = onFires.reduceSort();
            expect(onFireSorted.get(state)).toEqual([32, 54, undefined]);
        });
    });
});
