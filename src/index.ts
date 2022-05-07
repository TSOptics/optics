export type { Optic } from './Optic';
export { optic, opticPartial } from './constructors';
export { total, partial, mapped } from './types';

import stores from './react/stores';
export { stores };

import useOptic from './react/useOptic';
import useKeyedOptics from './react/useKeyedOptics';
import createStore from './react/createStore';
export { useOptic, useKeyedOptics, createStore };
