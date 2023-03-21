import { Lens } from './types';

const isMapped = (lenses: Lens[]): boolean => {
    return lenses.reduce(
        (acc, cv) => (cv.type === 'fold' ? false : acc || cv.type === 'map' || cv.type === 'foldN'),
        false,
    );
};

export default isMapped;
