import { Optic } from '../Optic';
import { Lens, OpticType, total } from '../types';

export class StoreOptic<A, TOpticType extends OpticType = total, S = any> extends Optic<A, TOpticType, S> {
    protected override derive(newLenses: Lens[]) {
        return new StoreOptic([...this.lenses, ...newLenses]);
    }

    subscribe() {
        return 42;
    }
}

declare module '../Optic' {
    export interface ResolveClass<TOptic extends Optic<any, OpticType>, A, TOpticType extends OpticType, S> {
        (): TOptic extends StoreOptic<any, OpticType> ? StoreOptic<A, TOpticType, S> : Optic<A, TOpticType, S>;
    }
}
