module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
    testPathIgnorePatterns: ['.\\.test\\-d\\.ts'],
};
