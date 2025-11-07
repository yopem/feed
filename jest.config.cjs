const nextJest = require('next/jest.js')

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  displayName: 'yopem-feed',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/app/**/{layout,page,loading,error,not-found}.{js,jsx,ts,tsx}',
    '!src/app/**/route.ts',
    '!src/lib/db/migrations/**',
    '!src/lib/db/index.ts',
    '!src/lib/db/redis.ts',
    '!src/lib/api/routers/**',
    '!src/lib/api/trpc.ts',
    '!src/lib/api/root.ts',
    '!src/lib/api/error.ts',
    '!src/lib/auth/**',
    '!src/lib/trpc/**',
    '!src/lib/env/server.ts',
    '!src/styles/**',
    '!src/components/ui/**',
    '!src/components/providers.tsx',
    '!src/components/scripts.tsx',
    '!src/components/link.tsx',
    '!src/components/theme/theme-provider.tsx',
    '!src/proxy.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 60,
      functions: 65,
      lines: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
}

module.exports = async () => {
  const nextJestConfig = await createJestConfig(config)()
  return {
    ...nextJestConfig,
    moduleNameMapper: {
      '^server-only$': '<rootDir>/__mocks__/server-only.js',
      '^superjson$': '<rootDir>/__mocks__/superjson.js',
      '^@/test-utils$': '<rootDir>/test-utils/index.ts',
      '^@/test-utils/(.*)$': '<rootDir>/test-utils/$1',
      '^@/(.*)$': '<rootDir>/src/$1',
      ...nextJestConfig.moduleNameMapper,
    },
    transformIgnorePatterns: [
      'node_modules/(?!(nuqs)/)',
    ],
  }
}
