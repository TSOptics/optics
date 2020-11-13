const generateParams = (n: number): string => `${n > 1 ? generateParams(n - 1) + ', ' : ''}k${n}: Key${n}`;

function generateTypeParam(n: number): string {
    return `NonNullable<${n > 1 ? generateTypeParam(n - 1) + `[Key${n - 1}]` : 'A'}>`;
}

function generateTypeParams(n: number): string {
    return `${n > 1 ? generateTypeParams(n - 1) + ', ' : ''}Key${n} extends keyof ${generateTypeParam(n)}`;
}

function generateType(n: number): string {
    return n > 1 ? `NonNullable<${generateType(n - 1)}>[Key${n - 1}]` : 'A';
}

function generateTypesUnion(n: number): string {
    return n > 1 ? `${generateTypesUnion(n - 1)} | ${generateType(n)}` : 'A';
}

function generatePathMethod(n: number) {
    return `path<${generateTypeParams(n)}>(${generateParams(n)}): Return<S, ${generateTypesUnion(n)}, ${generateType(
        n + 1,
    )}, Optional>;`;
}
