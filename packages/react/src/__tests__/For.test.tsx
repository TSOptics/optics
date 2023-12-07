import { Optic, createState, mapped, partial } from '@optics/state';
import React, { memo, useRef } from 'react';
import { useOptic } from '../useOptic';
import { For } from '../For';
import { act, render } from '@testing-library/react';

describe('For', () => {
    const Number = memo(({ numberOptic }: { numberOptic: Optic<number> }) => {
        const [n] = useOptic(numberOptic);
        const renders = useRef(0);
        renders.current = renders.current + 1;

        return (
            <div data-testid="elems">
                <h1 data-testid="renders">{renders.current}</h1>
                <h1 data-testid="display">{n}</h1>
            </div>
        );
    });

    describe.only('with optic focused on array', () => {
        const NumbersWithFor = ({ arrayOptic }: { arrayOptic: Optic<number[], partial> }) => {
            return (
                <div>
                    <For optic={arrayOptic} getKey={(n) => n.toString()}>
                        {(optic) => <Number numberOptic={optic} />}
                    </For>
                </div>
            );
        };

        it('should not rerender the existing cells when prepending', () => {
            const arrayOptic = createState([1, 2]);
            const { getAllByTestId } = render(<NumbersWithFor arrayOptic={arrayOptic} />);

            act(() => arrayOptic.set((prev) => [prev[0] - 1, ...prev]));
            const elems = getAllByTestId('display');
            const renders = getAllByTestId('renders');

            expect(elems.map((x) => x.textContent)).toStrictEqual(['0', '1', '2']);
            expect(renders.map((x) => x.textContent)).toEqual(['1', '1', '1']);
        });
    });
    describe('with mapped optic', () => {
        const NumbersWithFor = ({ mappedOptic }: { mappedOptic: Optic<number, mapped> }) => {
            return (
                <div>
                    <For mappedOptic={mappedOptic} getKey={(n) => n.toString()}>
                        {(optic) => <Number numberOptic={optic} />}
                    </For>
                </div>
            );
        };

        it('should not rerender the existing cells when prepending', () => {
            const arrayOptic = createState([1, 2]);
            const mappedOptic = arrayOptic.map();
            const { getAllByTestId } = render(<NumbersWithFor mappedOptic={mappedOptic} />);

            act(() => arrayOptic.set((prev) => [prev[0] - 1, ...prev]));
            const elems = getAllByTestId('display');
            const renders = getAllByTestId('renders');

            expect(elems.map((x) => x.textContent)).toStrictEqual(['0', '1', '2']);
            expect(renders.map((x) => x.textContent)).toEqual(['1', '1', '1']);
        });
    });
});
