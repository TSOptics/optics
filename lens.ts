export type Lens<S, A> = {
    get: (s: S) => A;
    set: (a: A, s: S) => S;
};

export type Optional<S, A> = {
    getOption: (s: S) => A | undefined;
    set: (a: A, s: S) => S;
};


type Path<T, R> = string[]

function get<T extends { [key: string]: any }, R>(path: Path<T, R>, root: T): R {
    const aux = ([hd, ...tl]: string[], obj: { [key: string]: any }): any => {
        const elem = obj[hd];
        if (tl.length > 0) return aux(tl, elem)
        else return elem
    }
    return aux(path, root)
}

function set<T extends { [key: string]: any }, R>(path: Path<T, R>, root: T, value: R): T {
    const aux = ([hd, ...tl]: string[], obj: { [key: string]: any }): any => {
        if (tl.length > 0) return {...obj, [hd]: aux(tl, obj[hd])}
        else return {...obj, [hd]: value}
    }
    return aux(path, root);
}

function root<T>(): Path<T, T> { return [] }

type Key<T> = keyof NonNullable<T> | Lens<NonNullable<T>, any>

type Type<Root, T> = T extends Lens<NonNullable<Root>, infer R> ? R : T extends keyof NonNullable<Root> ? NonNullable<Root>[T] : never;

type Return<T, R> = undefined extends T ? R | undefined : null extends T ? R | undefined : R;

function path<Root, A extends Key<Root>, AT extends Type<Root, A>, B extends Key<AT>, BT extends Type<AT, B>, C extends Key<BT>, CT extends Type<BT, C>>(r: Path<Root, Root>, a: A, b: B, c: C): Return<Root | AT | BT, CT> {
}

type Test = { a?: { b?: { c?: { d?: { e: { f: { g: { h: { i: number } } } } } } } } }
