export type { Optic, total, partial } from './Optic';
export { optic, opticPartial } from './Optic';

import Provider from './react/provider';
export { Provider };

import useOptic from './react/useOptic';
import useArrayOptic from './react/useArrayOptic';
import createStore from './createStore';
export { useOptic, useArrayOptic, createStore };
