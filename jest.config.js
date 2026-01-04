export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts', '<rootDir>/src/test/a11y-setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/data/(.*)$': '<rootDir>/src/data/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test/cssModuleMock.cjs',
    '\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/src/test/fileMock.cjs',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/main.tsx',
    '!src/test/**',
    '!src/i18n/config.ts',
    '!src/serviceWorker.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
