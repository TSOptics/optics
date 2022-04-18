import { optic } from '../src';

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
const onState = optic<typeof state>();
const onInventoriesMap = onState.focus('playerList').map().focus('inventory').map();
const onDurabilities = onInventoriesMap.focus('durability');
const onFires = onInventoriesMap.focus('enchantement?.fire');

describe('fold', () => {
    it('findFirst', () => {
        const lowerThan10Durability = onDurabilities.findFirst((x) => x < 10);
        expect(lowerThan10Durability.get(state)).toBe(6);
        expect(lowerThan10Durability.get(lowerThan10Durability.set((x) => x + 10, state))).toBe(2);

        const onDurabilityOf2 = onDurabilities.findFirst((x) => x === 2);
        expect(onDurabilityOf2.get(onDurabilityOf2.set((x) => x + 1, state))).toBe(undefined);
    });
    it('maxBy', () => {
        const onMaxDurability = onDurabilities.maxBy((x) => x);
        expect(onMaxDurability.get(state)).toBe(12);
        expect(onMaxDurability.get(onMaxDurability.set(0, state))).toBe(7);
    });
    it('minBy', () => {
        const onMinDurability = onDurabilities.minBy((x) => x);
        expect(onMinDurability.get(state)).toBe(2);
        expect(onMinDurability.get(onMinDurability.set(1000, state))).toBe(6);
    });
    it('atIndex', () => {
        expect(onDurabilities.atIndex(3).get(state)).toBe(7);
        expect(onDurabilities.atIndex(4).get(state)).toBe(undefined);
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
        const onState = optic<typeof state>();
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
});
