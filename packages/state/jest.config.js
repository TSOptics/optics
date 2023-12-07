module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
    testPathIgnorePatterns: ['.\\.test\\-d\\.ts'],
};
