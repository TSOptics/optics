export type { Optic } from './Optic';
export { optic, opticPartial } from './constructors';
export { total, partial, mapped as map, reduced as reduce } from './types';

import Provider from './react/provider';
export { Provider };

import useOptic from './react/useOptic';
import useArrayOptic from './react/useArrayOptic';
import createStore from './react/createStore';
export { useOptic, useArrayOptic, createStore };
