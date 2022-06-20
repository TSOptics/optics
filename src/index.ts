export type { Optic as BaseOptic } from './Optic';
export { optic, opticPartial } from './constructors';
export { total, partial, mapped } from './types';

export type { StoreOptic as Optic } from './react/StoreOptic';
import useOptic from './react/useOptic';
import useKeyedOptics from './react/useKeyedOptics';
import { createStore } from './react/Store';
import useOpticReducer from './react/useOpticReducer';
export { useOptic, useKeyedOptics, useOpticReducer, createStore };
