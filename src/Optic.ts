import { stabilize } from './utils';

export interface partial {
    partial: 'partial';
}
export interface total extends partial {
    total: 'total';
}

export interface Lens<A = any, S = any> {
    key: string | symbol;
    get: (s: S) => A;
    set: (a: A, s: S) => S;
}

export class Optic<A, TLensType extends partial = total, S = any> {
    private lenses: Lens[];
    constructor(lenses: Lens[]) {
        this.lenses = lenses;
    }
    #type: TLensType = {} as any;

    get: (s: S) => TLensType extends total ? A : A | undefined = (s) => {
        let accumulator: any = s;
        for (const lens of this.lenses) {
            const slice = lens.get(accumulator);
            if (slice === undefined || slice === null) {
                return slice;
            }
            accumulator = slice;
        }
        return accumulator;
    };

    set: (a: A, s: S) => S = (a, s) => {
        const aux = (a: A, s: S, lenses = this.lenses): S => {
            const [hd, ...tl] = lenses;
            if (!hd) return a as any;
            const slice = hd.get(s);
            if (tl.length > 0 && (slice === undefined || slice === null)) return s;
            const newSlice = aux(a, slice, tl);
            if (slice === newSlice) return s;
            return hd.set(newSlice, s);
        };
        return aux(a, s);
    };

    focus: Focus<A, TLensType, S> = (...props: any[]): any => {
        const lenses: Lens[] = props.map((prop) => ({
            key: 'focus ' + prop,
            get: (s) => s[prop],
            set: (a, s) => (Array.isArray(s) ? [...s.slice(0, prop), a, ...s.slice(prop + 1)] : { ...s, [prop]: a }),
        }));
        return new Optic([...this.lenses, ...lenses]);
    };

    focusMany: <Keys extends keyof NonNullable<A>, Prefix extends string | undefined>(
        props: Keys[],
        prefix?: Prefix,
    ) => {
        [Key in Keys as `${undefined extends Prefix ? 'on' : Prefix}${Key extends number
            ? Key
            : Capitalize<Key & string>}`]-?: Optic<
            NonNullable<A>[Key],
            undefined extends A ? partial : null extends A ? partial : TLensType,
            S
        >;
    } = (props, prefix) => {
        return props.reduce((acc, prop) => {
            const propName = prop.toString();
            const firstLetter = prefix !== '' ? propName.charAt(0).toUpperCase() : propName.charAt(0);
            acc[(prefix ?? 'on') + firstLetter + propName.slice(1)] = this.focus(prop);
            return acc;
        }, {} as any);
    };

    getKeys = () => {
        return this.lenses.map((l) => l.key);
    };

    compose: <B, TLensTypeB extends partial>(
        other: Optic<B, TLensTypeB, NonNullable<A>>,
    ) => Return<S, A, B, TLensTypeB extends total ? TLensType : partial> = (other) => {
        return new Optic([...this.lenses, ...other.lenses]) as any;
    };

    refine: <B>(refiner: (a: A) => B | false) => B extends false ? never : Optic<B, partial, S> = (refiner) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => (refiner(s) === false ? undefined : s),
                set: (a, s) => (refiner(s) === false ? s : a),
                key: 'refine',
            },
        ]) as any;
    };

    convert: <B>(get: (a: A) => B, reverseGet: (b: B) => A) => Optic<B, TLensType, S> = (get, reverseGet) => {
        return new Optic([...this.lenses, { get: stabilize(get), set: reverseGet, key: 'convert' }]);
    };

    filter: (predicate: (a: A) => boolean) => Optic<A, partial, S> = (predicate) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => (predicate(s) === true ? s : undefined),
                set: (a, s) => (predicate(s) === true ? a : s),
                key: 'filter',
            },
        ]);
    };

    findFirst: A extends Array<infer R> ? (predicate: (r: R) => boolean) => Optic<R, partial, S> : never = ((
        predicate: (value: unknown) => boolean,
    ) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s: unknown[]) => s.find(predicate),
                set: (a: unknown, s: unknown[]) => {
                    const i = s.findIndex(predicate);
                    if (i === -1) return s;
                    return [...s.slice(0, i), a, ...s.slice(i + 1)];
                },
                key: 'findFirst',
            },
        ]);
    }) as any;

    key: A extends Record<string, infer R> ? (key: string) => Optic<R, partial, S> : never = ((key: string) => {
        return new Optic([
            ...this.lenses,
            {
                get: (s) => s[key],
                set: (a, s) => (s[key] !== undefined ? { ...s, [key]: a } : s),
                key: `record key: ${key}`,
            },
        ]);
    }) as any;

    toPartial: () => Optic<NonNullable<A>, partial, S> = () => new Optic([...this.lenses]);

    focusWithDefault: <Prop extends keyof NonNullable<A>>(
        prop: Prop,
        fallback: (parent: A) => NonNullable<NonNullable<A>[Prop]>,
    ) => Return<S, A, NonNullable<NonNullable<A>[Prop]>, TLensType> = (key, fallback) => {
        return new Optic([
            ...this.lenses,
            {
                get: stabilize((s) => {
                    const slice = s[key];
                    return slice !== undefined && slice !== null ? slice : fallback(s);
                }),
                set: (a, s) => ({ ...s, [key]: a }),
                key: `focus ${key} with default`,
            },
        ]) as any;
    };

    toString() {
        return this.getKeys().toString();
    }

    __unsafeReplaceLast = (newLast: Lens<A>) => {
        this.lenses[this.lenses.length - 1] = newLast;
    };

    __getFirst = () => this.lenses[0];
}

export function optic<A, S>(get: (s: S) => A, set: (a: A, s: S) => S, key?: string): Optic<A, total, S>;
export function optic<S>(key?: string): Optic<S, total, S>;
export function optic<A, S>(
    getOrKey?: string | ((s: S) => A),
    set?: (a: A, s: S) => S,
    key?: string,
): Optic<A, total, S> {
    if (typeof getOrKey === 'function') {
        return new Optic([{ get: stabilize(getOrKey), set: set as any, key: key ?? 'custom optic' }]);
    }
    return new Optic([{ get: (s) => s, set: (a) => a, key: getOrKey || 'custom optic' }]);
}

export function opticPartial<A, S>(
    get: (s: S) => A | undefined,
    set: (a: A, s: S) => S,
    key?: string,
): Optic<A, partial, S>;
export function opticPartial<S>(key?: string): Optic<S, partial, S>;
export function opticPartial<A, S>(
    getOrKey?: string | ((s: S) => A),
    set?: (a: A, s: S) => S,
    key?: string,
): Optic<A, partial, S> {
    if (typeof getOrKey === 'function') {
        return new Optic([{ get: stabilize(getOrKey), set: set as any, key: key ?? 'custom partial optic' }]);
    }
    return new Optic([{ get: (s) => s, set: (a) => a, key: getOrKey || 'custom partial optic' }]);
}
type Return<Root, Types, LastType, TLensType extends partial> = TLensType extends total
    ? undefined extends Types
        ? Optic<LastType, partial, Root>
        : null extends Types
        ? Optic<LastType, partial, Root>
        : Optic<LastType, total, Root>
    : Optic<LastType, partial, Root>;

interface Focus<A, TLensType extends partial, S> {
    <Key1 extends keyof NonNullable<A>>(k1: Key1): Return<S, A, NonNullable<A>[Key1], TLensType>;
    <Key1 extends keyof NonNullable<A>, Key2 extends keyof NonNullable<NonNullable<A>[Key1]>>(
        k1: Key1,
        k2: Key2,
    ): Return<S, A | NonNullable<A>[Key1], NonNullable<NonNullable<A>[Key1]>[Key2], TLensType>;
    <
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
    >(
        k1: Key1,
        k2: Key2,
        k3: Key3,
    ): Return<
        S,
        A | NonNullable<A>[Key1] | NonNullable<NonNullable<A>[Key1]>[Key2],
        NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3],
        TLensType
    >;
    <
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
        Key4 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>,
    >(
        k1: Key1,
        k2: Key2,
        k3: Key3,
        k4: Key4,
    ): Return<
        S,
        | A
        | NonNullable<A>[Key1]
        | NonNullable<NonNullable<A>[Key1]>[Key2]
        | NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3],
        NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4],
        TLensType
    >;
    <
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
        Key4 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>,
        Key5 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>,
    >(
        k1: Key1,
        k2: Key2,
        k3: Key3,
        k4: Key4,
        k5: Key5,
    ): Return<
        S,
        | A
        | NonNullable<A>[Key1]
        | NonNullable<NonNullable<A>[Key1]>[Key2]
        | NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]
        | NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4],
        NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5],
        TLensType
    >;
    <
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
        Key4 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>,
        Key5 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>,
        Key6 extends keyof NonNullable<
            NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        >,
    >(
        k1: Key1,
        k2: Key2,
        k3: Key3,
        k4: Key4,
        k5: Key5,
        k6: Key6,
    ): Return<
        S,
        | A
        | NonNullable<A>[Key1]
        | NonNullable<NonNullable<A>[Key1]>[Key2]
        | NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]
        | NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]
        | NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5],
        NonNullable<
            NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        >[Key6],
        TLensType
    >;
    <
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
        Key4 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>,
        Key5 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>,
        Key6 extends keyof NonNullable<
            NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        >,
        Key7 extends keyof NonNullable<
            NonNullable<
                NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
            >[Key6]
        >,
    >(
        k1: Key1,
        k2: Key2,
        k3: Key3,
        k4: Key4,
        k5: Key5,
        k6: Key6,
        k7: Key7,
    ): Return<
        S,
        | A
        | NonNullable<A>[Key1]
        | NonNullable<NonNullable<A>[Key1]>[Key2]
        | NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]
        | NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]
        | NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        | NonNullable<
              NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
          >[Key6],
        NonNullable<
            NonNullable<
                NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
            >[Key6]
        >[Key7],
        TLensType
    >;
    <
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
        Key4 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>,
        Key5 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>,
        Key6 extends keyof NonNullable<
            NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        >,
        Key7 extends keyof NonNullable<
            NonNullable<
                NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
            >[Key6]
        >,
        Key8 extends keyof NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                >[Key6]
            >[Key7]
        >,
    >(
        k1: Key1,
        k2: Key2,
        k3: Key3,
        k4: Key4,
        k5: Key5,
        k6: Key6,
        k7: Key7,
        k8: Key8,
    ): Return<
        S,
        | A
        | NonNullable<A>[Key1]
        | NonNullable<NonNullable<A>[Key1]>[Key2]
        | NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]
        | NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]
        | NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        | NonNullable<
              NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
          >[Key6]
        | NonNullable<
              NonNullable<
                  NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
              >[Key6]
          >[Key7],
        NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                >[Key6]
            >[Key7]
        >[Key8],
        TLensType
    >;
    <
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
        Key4 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>,
        Key5 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>,
        Key6 extends keyof NonNullable<
            NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        >,
        Key7 extends keyof NonNullable<
            NonNullable<
                NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
            >[Key6]
        >,
        Key8 extends keyof NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                >[Key6]
            >[Key7]
        >,
        Key9 extends keyof NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<
                        NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                    >[Key6]
                >[Key7]
            >[Key8]
        >,
    >(
        k1: Key1,
        k2: Key2,
        k3: Key3,
        k4: Key4,
        k5: Key5,
        k6: Key6,
        k7: Key7,
        k8: Key8,
        k9: Key9,
    ): Return<
        S,
        | A
        | NonNullable<A>[Key1]
        | NonNullable<NonNullable<A>[Key1]>[Key2]
        | NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]
        | NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]
        | NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        | NonNullable<
              NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
          >[Key6]
        | NonNullable<
              NonNullable<
                  NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
              >[Key6]
          >[Key7]
        | NonNullable<
              NonNullable<
                  NonNullable<
                      NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                  >[Key6]
              >[Key7]
          >[Key8],
        NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<
                        NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                    >[Key6]
                >[Key7]
            >[Key8]
        >[Key9],
        TLensType
    >;
    <
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
        Key4 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>,
        Key5 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>,
        Key6 extends keyof NonNullable<
            NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        >,
        Key7 extends keyof NonNullable<
            NonNullable<
                NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
            >[Key6]
        >,
        Key8 extends keyof NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                >[Key6]
            >[Key7]
        >,
        Key9 extends keyof NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<
                        NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                    >[Key6]
                >[Key7]
            >[Key8]
        >,
        Key10 extends keyof NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<
                        NonNullable<
                            NonNullable<
                                NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]
                            >[Key5]
                        >[Key6]
                    >[Key7]
                >[Key8]
            >[Key9]
        >,
    >(
        k1: Key1,
        k2: Key2,
        k3: Key3,
        k4: Key4,
        k5: Key5,
        k6: Key6,
        k7: Key7,
        k8: Key8,
        k9: Key9,
        k10: Key10,
    ): Return<
        S,
        | A
        | NonNullable<A>[Key1]
        | NonNullable<NonNullable<A>[Key1]>[Key2]
        | NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]
        | NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]
        | NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
        | NonNullable<
              NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
          >[Key6]
        | NonNullable<
              NonNullable<
                  NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
              >[Key6]
          >[Key7]
        | NonNullable<
              NonNullable<
                  NonNullable<
                      NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>[Key5]
                  >[Key6]
              >[Key7]
          >[Key8]
        | NonNullable<
              NonNullable<
                  NonNullable<
                      NonNullable<
                          NonNullable<
                              NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]
                          >[Key5]
                      >[Key6]
                  >[Key7]
              >[Key8]
          >[Key9],
        NonNullable<
            NonNullable<
                NonNullable<
                    NonNullable<
                        NonNullable<
                            NonNullable<
                                NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]
                            >[Key5]
                        >[Key6]
                    >[Key7]
                >[Key8]
            >[Key9]
        >[Key10],
        TLensType
    >;
}