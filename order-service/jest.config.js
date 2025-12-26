/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    clearMocks: true,
    coverageThreshold: { global: { branches: 40, functions: 50, lines: 50, statements: 50 } },
    moduleNameMapper: {
        '^@ecommerce/shared$': '<rootDir>/__mocks__/@ecommerce/shared',
    },
    moduleDirectories: ['node_modules', '<rootDir>/__mocks__'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            isolatedModules: true
        }]
    }
};
