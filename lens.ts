type Key<T> = keyof NonNullable<T>;

type Type<Root, T extends keyof NonNullable<Root>> = NonNullable<Root>[T];

type Return<Root, Types, LastType, Optional extends boolean> = Optional extends true
    ? Path<Root, LastType, true>
    : undefined extends Types
    ? Path<Root, LastType, true>
    : null extends Types
    ? Path<Root, LastType, true>
    : Path<Root, LastType, false>;

type Failure = 'failure';

interface Lens {
    key: string;
    get: (s: any) => any;
    set: (a: any, s: any) => any;
}

function createCombinator<S, A, Return, Args extends any[]>(
    f: (
        ...args: Args
    ) => {
        key: string;
        get: (s: S) => Return;
        set: (a: A, s: S) => S;
    },
): (...args: Args) => Path<S, A, Failure extends Return ? true : false> {
    return (...args) => new Path([f(...args)]);
}

const testCombinator = createCombinator((index: number) => ({
    key: `at index ${index}`,
    get: (s: number[]) => s[index] || 'failure',
    set: (a: number, s: number[]) => [...s.slice(0, index), a, ...s.slice(index + 1)],
}));

const findFirst = createCombinator(<T>(predicate: (x: T) => boolean) => ({
    key: 'findFirst',
    get: (s: T[]) => {
        const elem = s.find(predicate);
        if (elem !== undefined) return elem;
        return 'failure';
    },
    set: (a: T, s: T[]) => s,
}));

class Path<S, A, Optional extends boolean> {
    constructor(readonly lenses: Lens[]) {}

    get(s: S): Optional extends true ? A | undefined : A {
        let accumulator: any = s;
        for (const [index, lens] of this.lenses.entries()) {
            const slice = lens.get(s);
            if (slice === 'failure' && index < this.lenses.length - 1) {
                return undefined as any;
            }
            accumulator = slice;
        }
        return accumulator;
    }

    set(a: A, s: S): S {
        const aux = (a: A, s: S, lenses = this.lenses): S => {
            const [hd, ...tl] = lenses;
            if (!hd) return a as any;
            const slice = hd.get(s);
            if (tl.length > 0 && (slice === undefined || slice === null || slice === 'failure')) return s;
            return hd.set(aux(a, slice, tl), s);
        };
        return aux(a, s);
    }

    getKeys() {
        return this.lenses.map((l) => l.key);
    }

    compose<B, OptionalB extends boolean>(
        path: Path<A, B, OptionalB>,
    ): Path<S, B, OptionalB extends true ? true : Optional extends true ? true : false> {
        return new Path([...this.lenses, ...path.lenses]);
    }

    path<Key1 extends Key<A>, Type1 extends Type<A, Key1>>(k1: Key1): Return<S, A, Type1, Optional>;

    path<Key1 extends keyof NonNullable<A>, Key2 extends keyof NonNullable<NonNullable<A>[Key1]>>(
        k1: Key1,
        k2: Key2,
    ): Return<S, A | NonNullable<A>[Key1], NonNullable<NonNullable<A>[Key1]>[Key2], Optional>;

    path<
        Key1 extends Key<A>,
        Type1 extends Type<A, Key1>,
        Key2 extends Key<Type1>,
        Type2 extends Type<Type1, Key2>,
        Key3 extends Key<Type2>,
        Type3 extends Type<Type2, Key3>
    >(k1: Key1, k2: Key2, k3: Key3): Return<S, A | Type1 | Type2, Type3, Optional>;

    path<
        Key1 extends Key<A>,
        Type1 extends Type<A, Key1>,
        Key2 extends Key<Type1>,
        Type2 extends Type<Type1, Key2>,
        Key3 extends Key<Type2>,
        Type3 extends Type<Type2, Key3>,
        Key4 extends Key<Type3>,
        Type4 extends Type<Type3, Key4>
    >(k1: Key1, k2: Key2, k3: Key3, k4: Key4): Return<S, A | Type1 | Type2 | Type3, Type4, Optional>;

    path<
        Key1 extends keyof NonNullable<A>,
        Key2 extends keyof NonNullable<NonNullable<A>[Key1]>,
        Key3 extends keyof NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>,
        Key4 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>,
        Key5 extends keyof NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<A>[Key1]>[Key2]>[Key3]>[Key4]>
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
        Optional
    >;
    path<
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
        >
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
        Optional
    >;
    path(args: string[]): Path<S, any, boolean> {
        return {} as any;
    }
}

function root<T>(key = 'root'): Path<T, T, false> {
    return new Path([{ key, get: (s) => s, set: (a, _) => a }]);
}

const p1 = {} as Path<
    string,
    {
        a: { a1: { a2: { a3: { a4: { a5: { a6?: { a7: { a8: number } } } } } } }[] };
        b: number[];
        c: boolean;
        d?: () => void;
    },
    false
>;
const p2 = p1.path('a', 'a1', 0, 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8');
