export type { BaseOptic } from './BaseOptic';
export { optic, opticPartial } from './constructors';
export { total, partial, mapped } from './types';

export type { Optic } from './Optic';
import useOptic from './react/useOptic';
import useKeyedOptics from './react/useKeyedOptics';
import { createStore } from './Store';
import useOpticReducer from './react/useOpticReducer';
export { useOptic, useKeyedOptics, useOpticReducer, createStore };
