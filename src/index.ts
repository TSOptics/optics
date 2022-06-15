export type { Optic } from './Optic';
export { optic, opticPartial } from './constructors';
export { total, partial, mapped } from './types';

export type { StoreOptic } from './react/StoreOptic';
import useOptic from './react/useOptic';
import useKeyedOptics from './react/useKeyedOptics';
import { createStore, subscribe, getStore, setStore } from './react/Store';
import useOpticReducer from './react/useOpticReducer';
export { useOptic, useKeyedOptics, useOpticReducer, createStore, subscribe, getStore, setStore };
