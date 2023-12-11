import { pureOptic } from '../pureOpticConstructor';

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

describe('reduce', () => {
    it('should return the original root when calling set with the the same reference', () => {
        // map
        expect(durabilitiesOptic.set((x) => x, state)).toBe(state);
        // reduce
        expect(durabilitiesOptic.reduce((values) => values.find(({ value }) => value > 5)).set((x) => x, state)).toBe(
            state,
        );
        // reduce to multiple
        expect(durabilitiesOptic.reduce((values) => values.filter(({ value }) => value > 5)).set((x) => x, state)).toBe(
            state,
        );
    });
    it('should return the original root when calling set on a reduce to nothing', () => {
        // reduce
        expect(durabilitiesOptic.reduce((values) => values.find(({ value }) => value === 1000)).set(42, state)).toBe(
            state,
        );
        // reduce to multiple
        expect(durabilitiesOptic.reduce((values) => values.filter(({ value }) => value === 1000)).set(42, state)).toBe(
            state,
        );
    });
    it("should return empty array if a partial doesn't resolve", () => {
        // map
        const nullableArrayOptic = pureOptic<number[] | undefined>().map();
        expect(nullableArrayOptic.get(undefined)).toEqual([]);
        // reduce to multiple
        expect(
            nullableArrayOptic.reduce((values) => values.filter(({ value }) => value % 2 === 0)).get(undefined),
        ).toEqual([]);
    });
    it('should allow consecutive calls to reduce', () => {
        const secondOver5AndEven = durabilitiesOptic
            .reduce((values) => values.filter(({ value }) => value > 5))
            .reduce((values) => values.filter(({ value }) => value % 2 === 0))
            .reduce((values) => values[1]);
        expect(secondOver5AndEven.get(state)).toBe(6);
        const newState = secondOver5AndEven.set((x) => x + 1, state);
        expect(durabilitiesOptic.get(newState)).toEqual([12, 7, 2, 7]);
    });
    it('should return empty array or undefined when reducing to nothing', () => {
        // reduce
        expect(durabilitiesOptic.reduce((values) => values.filter(({ value }) => value === 1000)).get(state)).toEqual(
            [],
        );
        // reduce to multiple
        expect(durabilitiesOptic.reduce((values) => values.find(({ value }) => value === 1000)).get(state)).toBe(
            undefined,
        );
    });
    it('findFirst', () => {
        const lowerThan10Durability = durabilitiesOptic.reduce((values) => values.find(({ value }) => value < 10));
        expect(lowerThan10Durability.get(state)).toBe(6);
        expect(lowerThan10Durability.get(lowerThan10Durability.set((x) => x + 10, state))).toBe(2);

        const durabilityOf2Optic = durabilitiesOptic.reduce((values) => values.find(({ value }) => value === 2));
        expect(durabilityOf2Optic.get(durabilityOf2Optic.set((x) => x + 1, state))).toBe(undefined);
    });
    it('max', () => {
        const maxDurabilityOptic = durabilitiesOptic.reduce((values) =>
            values.reduce((acc, cv) => (cv.value > acc.value ? cv : acc)),
        );

        expect(maxDurabilityOptic.get(state)).toBe(12);
        const newState = maxDurabilityOptic.set(0, state);
        expect(maxDurabilityOptic.get(newState)).toBe(7);
    });
    it('at', () => {
        expect(durabilitiesOptic.reduce((values) => values[3]).get(state)).toBe(7);
        expect(durabilitiesOptic.reduce((values) => values[4]).get(state)).toBe(undefined);
        expect(durabilitiesOptic.get(durabilitiesOptic.reduce((values) => values[3]).set(42, state))).toEqual([
            12, 6, 2, 42,
        ]);
    });
    it('filter', () => {
        const evenDurabilitiesOptic = durabilitiesOptic.reduce((values) =>
            values.filter(({ value }) => value % 2 === 0),
        );
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
            .reduce((values) => values.filter(({ value }) => value % 2 === 0));
        expect(evensOptic.get(state)).toEqual([2, 4, 8, 6, 8, 12, 0]);
        expect(stateOptic.get(evensOptic.set(42, state))).toEqual([
            [1, 42, 3, 42, 9, 42],
            [5, 42, 7, 42],
            [42, 42],
        ]);
    });
    it('slice', () => {
        const firstTwoOptic = durabilitiesOptic.reduce((values) => values.slice(0, 2));
        expect(firstTwoOptic.get(state)).toEqual([12, 6]);

        const noneOptic = durabilitiesOptic.reduce((values) => values.slice(2, 1));
        expect(noneOptic.get(state)).toEqual([]);

        const lastThreeOptic = durabilitiesOptic.reduce((values) => values.slice(-3));
        expect(lastThreeOptic.get(state)).toEqual([6, 2, 7]);

        const allOptic = durabilitiesOptic.reduce((values) => values.slice());
        expect(allOptic.get(state)).toEqual([12, 6, 2, 7]);

        expect(durabilitiesOptic.get(lastThreeOptic.set((d) => d * 2, state))).toEqual([12, 12, 4, 14]);
    });
    it('sort', () => {
        const ascSortOptic = durabilitiesOptic.reduce((values) => [...values].sort((a, b) => a.value - b.value));
        expect(ascSortOptic.get(state)).toEqual([2, 6, 7, 12]);

        const descSortOptic = durabilitiesOptic.reduce((values) => [...values].sort((a, b) => b.value - a.value));
        expect(descSortOptic.get(state)).toEqual([12, 7, 6, 2]);
    });
});
