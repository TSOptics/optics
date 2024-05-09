import OpticImpl from './Optic.impl';
import { Modifiers } from './types';

export type Store<T = any> = { state: T; listeners: Set<(root: T) => void> };

export const stores: WeakMap<OpticImpl<any, Modifiers>, Store> = new WeakMap();
