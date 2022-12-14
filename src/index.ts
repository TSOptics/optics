export type { PureOptic } from './PureOptic.types';
export { total, partial, mapped } from './types';

export type { Optic } from './state/Optic.types';
import useOptic from './state/react/useOptic';
import useKeyedOptics from './state/react/useKeyedOptics';
import { createStore } from './state/Store';
import useOpticReducer from './state/react/useOpticReducer';
export { useOptic, useKeyedOptics, useOpticReducer, createStore };
