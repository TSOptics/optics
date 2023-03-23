import { OpticType } from '@optix/core/src/types';
import OpticImpl from './Optic.impl';

export type Store<T = any> = { state: T; listeners: Set<(root: T) => void> };

export const stores: WeakMap<OpticImpl<any, OpticType>, Store> = new WeakMap();