function generateTypeConstraint(n: number): string {
    if (n === 1) {
        return 'K';
    }
    return generateTypeConstraint(n - 1) + `, K${n}`;
}

function generateTypeParams(n: number): string {
    if (n === 1) {
        return 'K extends Helper<T>';
    }
    return generateTypeParams(n - 1) + `, K${n} extends Helper<Prop${n - 1}<T, ${generateTypeConstraint(n)}>>`;
}

function generateReturnType(n: number): string {
    if (n === 1) {
        return `T`;
    }
    return generateReturnType(n - 1) + `, K${n === 1 ? '' : n}`;
}

function generatePropType(n: number): string[] {
    if (n === 1) {
        return [`type Prop1<T, K extends Helper<T>> = NonNullable<T>[K]`];
    }
    return [
        ...generatePropType(n - 1),
        `type Prop${n}<T${generateTypeParams(n)}> = NonNullable<Prop${n - 1}<${generateReturnType(n)}>>[K${n}]`,
    ];
}
