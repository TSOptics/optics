import {DeepNonNullable} from 'ts-essentials'

type Test = { a?: { b?: { c?: { d?: { e: { f: { g: { h: { i: number } } } } } } } } }

function generateTypeConstraint(n: number) {
    if (n === 1) {
        return 'K'
    }
    return generateTypeConstraint(n - 1) + `, K${n}`
}

function generateTypeParams(n: number) {
    if (n === 1) {
        return 'K extends Helper<T>'
    }
    return generateTypeParams(n - 1) + `, K${n} extends Helper<Prop${n - 1}<T, ${generateTypeConstraint(n)}>>`
}

function generateReturnType(n: number) {
    if (n === 1) {
        return `T`
    }
    return generateReturnType(n - 1) + `, K${n === 1 ? '' : n}`
}

function generatePropType(n: number) {
    if (n === 1) {
        return [`type Prop1<T, K extends Helper<T>> = NonNullable<T>[K]`]
    }
    return [...generatePropType(n - 1), `type Prop${n}<T${generateTypeParams(n)}> = NonNullable<Prop${n - 1}<${generateReturnType(n)}>>[K${n}]`]
}

type Helper<T> = keyof NonNullable<T>

type Prop1<T, K extends Helper<T>> = NonNullable<T>[K]
type Prop2<T, K extends Helper<T>, K2 extends Helper<Prop1<T, K>>> = NonNullable<Prop1<T, K>>[K2]
type Prop3<T, K extends Helper<T>, K2 extends Helper<Prop1<T, K>>, K3 extends Helper<Prop2<T, K, K2>>> = NonNullable<Prop2<T, K, K2>>[K3]
type Prop4<T, K extends Helper<T>, K2 extends Helper<Prop1<T, K>>, K3 extends Helper<Prop2<T, K, K2>>, K4 extends Helper<Prop3<T, K, K2, K3>>> = NonNullable<Prop3<T, K, K2, K3>>[K4]
type Prop5<T, K extends Helper<T>, K2 extends Helper<Prop1<T, K>>, K3 extends Helper<Prop2<T, K, K2>>, K4 extends Helper<Prop3<T, K, K2, K3>>, K5 extends Helper<Prop4<T, K, K2, K3, K4>>> = NonNullable<Prop4<T, K, K2, K3, K4>>[K5]
type Prop6<T, K extends Helper<T>, K2 extends Helper<Prop1<T, K>>, K3 extends Helper<Prop2<T, K, K2>>, K4 extends Helper<Prop3<T, K, K2, K3>>, K5 extends Helper<Prop4<T, K, K2, K3, K4>>, K6 extends Helper<Prop5<T, K, K2, K3, K4, K5>>> = NonNullable<Prop5<T, K, K2, K3, K4, K5>>[K6]
type Prop7<T, K extends Helper<T>, K2 extends Helper<Prop1<T, K>>, K3 extends Helper<Prop2<T, K, K2>>, K4 extends Helper<Prop3<T, K, K2, K3>>, K5 extends Helper<Prop4<T, K, K2, K3, K4>>, K6 extends Helper<Prop5<T, K, K2, K3, K4, K5>>, K7 extends Helper<Prop6<T, K, K2, K3, K4, K5, K6>>> = NonNullable<Prop6<T, K, K2, K3, K4, K5, K6>>[K7]
type Prop8<T, K extends Helper<T>, K2 extends Helper<Prop1<T, K>>, K3 extends Helper<Prop2<T, K, K2>>, K4 extends Helper<Prop3<T, K, K2, K3>>, K5 extends Helper<Prop4<T, K, K2, K3, K4>>, K6 extends Helper<Prop5<T, K, K2, K3, K4, K5>>, K7 extends Helper<Prop6<T, K, K2, K3, K4, K5, K6>>, K8 extends Helper<Prop7<T, K, K2, K3, K4, K5, K6, K7>>> = NonNullable<Prop7<T, K, K2, K3, K4, K5, K6, K7>>[K8]
type Prop9<T, K extends Helper<T>, K2 extends Helper<Prop1<T, K>>, K3 extends Helper<Prop2<T, K, K2>>, K4 extends Helper<Prop3<T, K, K2, K3>>, K5 extends Helper<Prop4<T, K, K2, K3, K4>>, K6 extends Helper<Prop5<T, K, K2, K3, K4, K5>>, K7 extends Helper<Prop6<T, K, K2, K3, K4, K5, K6>>, K8 extends Helper<Prop7<T, K, K2, K3, K4, K5, K6, K7>>, K9 extends Helper<Prop8<T, K, K2, K3, K4, K5, K6, K7, K8>>> = NonNullable<Prop8<T, K, K2, K3, K4, K5, K6, K7, K8>>[K9]

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

function path<TRoot, A, B extends keyof NonNullable<A>>(root: Path<TRoot, A>, prop: B): Path<TRoot, NonNullable<A>[B]>;
function path<TRoot, A, B extends keyof NonNullable<A>, C extends keyof NonNullable<NonNullable<A>[B]>>(root: Path<TRoot, A>, b: B, c: C): Path<TRoot, NonNullable<NonNullable<A>[B]>[C]>;
function path<TRoot, A, B extends keyof A, C extends keyof A[B], D extends keyof A[B][C]>(root: Path<TRoot, A>, b: B, c: C, d: D): Path<TRoot, A[B][C][D]>;
function path<TRoot, A, B extends keyof A, C extends keyof A[B], D extends keyof A[B][C], E extends keyof A[B][C][D]>(root: Path<TRoot, A>, b: B, c: C, d: D, e: E): Path<TRoot, A[B][C][D][E]>;

function path(a: Path<any, any>, ...props: string[]) {
    return [...a,...props]
}

function compose<T, U, R>(path1: Path<T, U>, path2: Path<U, R>): Path<T, R> {
    return [...path1, ...path2];
}
