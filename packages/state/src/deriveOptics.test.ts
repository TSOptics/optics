import { createState } from './createState';
import { deriveOptics, deriveOpticsMapped } from './deriveOptics';

describe('deriveOptics', () => {
    describe('from optics on array', () => {
        const arrayOptic = createState([1, 2, 3, 4, 5]);
        const derivedOpticsOptic = deriveOptics({ optic: arrayOptic, getKey: (n) => n.toString() });
        derivedOpticsOptic.subscribe(() => {}, { denormalize: false });
        const originalOptics = derivedOpticsOptic.get({ denormalize: false }).map(([, optic]) => optic);
        const listeners = originalOptics.map((optic) => {
            const listener = jest.fn();
            optic.subscribe(listener, { denormalize: false });
            return listener;
        });

        arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
        arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
        const newOptics = derivedOpticsOptic.get({ denormalize: false }).map(([, optic]) => optic);

        it("should return the same optic for an element even if it's moved", () => {
            expect(originalOptics.every((optic, i) => optic === newOptics[i + 2])).toBe(true);
            expect(originalOptics.map((optic) => optic.get())).toEqual([1, 2, 3, 4, 5]);
        });
        it("shouldn't call the subscribers to optics whose focused value didn't change", () => {
            expect(listeners.every((listener) => listener.mock.calls.length === 0)).toBe(true);
        });
        it('should return undefined when focused element is removed', () => {
            arrayOptic.set([0, 1, 2, 3, 4]);
            expect(originalOptics[4].get()).toBe(undefined);
        });
    });
    describe('from mapped optic', () => {
        const arrayOptic = createState([1, 2, 3, 4, 5]);
        const mappedOptic = arrayOptic.map();

        const derivedOpticsOptic = deriveOpticsMapped({ optic: mappedOptic, getKey: (n) => n.toString() });
        derivedOpticsOptic.subscribe(() => {}, { denormalize: false });
        const originalOptics = derivedOpticsOptic.get({ denormalize: false })?.map(([, optic]) => optic);
        const listeners = originalOptics?.map((optic) => {
            const listener = jest.fn();
            optic.subscribe(listener, { denormalize: false });
            return listener;
        });

        arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
        arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
        const newOptics = derivedOpticsOptic.get({ denormalize: false })?.map(([, optic]) => optic) ?? [];

        it("should return the same optic for an element even if it's moved", () => {
            expect(originalOptics?.every((optic, i) => optic === newOptics[i + 2])).toBe(true);
            expect(originalOptics?.map((optic) => optic.get())).toEqual([1, 2, 3, 4, 5]);
        });
        it("shouldn't call the subscribers to optics whose focused value didn't change", () => {
            expect(listeners?.every((listener) => listener.mock.calls.length === 0)).toBe(true);
        });
        it('should return undefined when focused element is removed', () => {
            arrayOptic.set([0, 1, 2, 3, 4]);
            expect(originalOptics?.[4].get()).toBe(undefined);
        });
    });
});
