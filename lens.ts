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

function path<TRoot, A, B extends keyof A>(root: Path<TRoot, A>, prop: B): Path<TRoot, A[B]>;
function path<TRoot, A, B extends keyof A, C extends keyof A[B]>(root: Path<TRoot, A>, b: B, c: C): Path<TRoot, A[B][C]>;
function path<TRoot, A, B extends keyof A, C extends keyof A[B], D extends keyof A[B][C]>(root: Path<TRoot, A>, b: B, c: C, d: D): Path<TRoot, A[B][C][D]>;
function path<TRoot, A, B extends keyof A, C extends keyof A[B], D extends keyof A[B][C], E extends keyof A[B][C][D]>(root: Path<TRoot, A>, b: B, c: C, d: D, e: E): Path<TRoot, A[B][C][D][E]>;

function path(a: Path<any, any>, ...props: string[]) {
    return [...a,...props]
}

function compose<T, U, R>(path1: Path<T, U>, path2: Path<U, R>): Path<T, R> {
    return [...path1, ...path2];
}

type Test = { a: { b: { c: number; e: string, f: {g: {h: {i: number}}} } } }

const example: Test = { a: { b: { c: 42, e: 'yolo', f: {g: {h: {i: 1798}}} } } }


const pathToC = path(root<Test>(), 'a', 'b', 'c')
const pathToB = path(root<Test>(), 'a', 'b')
console.log(get(pathToC, example))
console.log(set(pathToC, example, 84))
const pathToI = path(pathToB, 'f', 'g', 'h', 'i')
console.log(set(pathToI, example, 1993))
