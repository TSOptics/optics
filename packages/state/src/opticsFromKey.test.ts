import { createState } from './createState';
import { opticsFromKey, opticsFromKeyMapped } from './opticsFromKey';

describe('opticsFromKey', () => {
    describe('with optic on array', () => {
        describe('derive optics with each focused on an element from a key', () => {
            const arrayOptic = createState([1, 2, 3, 4, 5]);

            const derivedOptics = opticsFromKey({
                optic: arrayOptic,
                getKey: (n) => n.toString(),
            })().map(([, optic]) => optic);

            const listeners = derivedOptics.map((optic) => {
                const listener = jest.fn();
                optic.subscribe(listener, { denormalize: false });
                return listener;
            });

            arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
            arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
            it("should focus on the same element even if it's moved", () => {
                expect(derivedOptics.map((optic) => optic.get())).toEqual([1, 2, 3, 4, 5]);
            });
            it("shouldn't call the subscribers to optics whose focused value didn't change", () => {
                expect(listeners?.every((listener) => listener.mock.calls.length === 0)).toBe(true);
            });
            it('should return undefined when focused element is removed', () => {
                arrayOptic.set([0, 1, 2, 3, 4]);
                expect(derivedOptics[4].get()).toBeUndefined();
            });
            it('should be able to update the focused element', () => {
                derivedOptics[0].set(42);
                expect(arrayOptic.get()).toEqual([0, 42, 2, 3, 4]);
                expect(derivedOptics[0].get()).toBeUndefined();
            });
        });

        describe('referential stability for the same key', () => {
            const arrayOptic = createState([1, 2, 3, 4, 5]);

            const deriveOptics = opticsFromKey({
                optic: arrayOptic,
                getKey: (n) => n.toString(),
            });
            const initialOptics = deriveOptics().map(([, optic]) => optic);

            arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
            arrayOptic.set((prev) => [prev[0] - 1, ...prev]);

            const newOptics = deriveOptics().map(([, optic]) => optic);

            it("should return the same optic for an element even if it's moved", () => {
                expect(initialOptics.every((optic, i) => optic === newOptics[i + 2])).toBe(true);
                expect(initialOptics.map((optic) => optic.get())).toEqual([1, 2, 3, 4, 5]);
            });
        });
    });

    describe('with mapped optic', () => {
        describe.only('derive optics with each focused on an element from a key', () => {
            const arrayOptic = createState([1, 2, 3, 4, 5]);
            const mappedOptic = arrayOptic.map();
            const derivedOptics = opticsFromKeyMapped({
                optic: mappedOptic,
                getKey: (n) => n.toString(),
            })().map(([, optic]) => optic);
            const listeners = derivedOptics.map((optic) => {
                const listener = jest.fn();
                optic.subscribe(listener, { denormalize: false });
                return listener;
            });
            arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
            arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
            it("should focus on the same element even if it's moved", () => {
                expect(derivedOptics.map((optic) => optic.get())).toEqual([1, 2, 3, 4, 5]);
            });
            it("shouldn't call the subscribers to optics whose focused value didn't change", () => {
                expect(listeners?.every((listener) => listener.mock.calls.length === 0)).toBe(true);
            });
            it('should return undefined when focused element is removed', () => {
                arrayOptic.set([0, 1, 2, 3, 4]);
                expect(derivedOptics[4].get()).toBe(undefined);
            });
            it('should be able to update the focused element', () => {
                derivedOptics[0].set(42);
                expect(arrayOptic.get()).toEqual([0, 42, 2, 3, 4]);
                expect(derivedOptics[0].get()).toBeUndefined();
            });
        });

        describe('referential stability for the same key', () => {
            const arrayOptic = createState([1, 2, 3, 4, 5]);
            const mappedOptic = arrayOptic.map();

            const deriveOptics = opticsFromKeyMapped({
                optic: mappedOptic,
                getKey: (n) => n.toString(),
            });
            const initialOptics = deriveOptics().map(([, optic]) => optic);

            arrayOptic.set((prev) => [prev[0] - 1, ...prev]);
            arrayOptic.set((prev) => [prev[0] - 1, ...prev]);

            const newOptics = deriveOptics().map(([, optic]) => optic);

            it("should return the same optic for an element even if it's moved", () => {
                expect(initialOptics.every((optic, i) => optic === newOptics[i + 2])).toBe(true);
                expect(initialOptics.map((optic) => optic.get())).toEqual([1, 2, 3, 4, 5]);
            });
        });
    });
});
