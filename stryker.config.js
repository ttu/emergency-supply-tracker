/** @type {import('@stryker-mutator/core').StrykerOptions} */
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  testRunnerNodeArgs: ['--experimental-vm-modules'],
  coverageAnalysis: 'perTest',
  mutate: [
    'src/utils/**/*.ts',
    '!src/utils/**/*.test.ts',
    '!src/utils/**/*.spec.ts',
    '!src/utils/test/**',
  ],
  // Focus on business logic - these are the most critical areas
  // You can expand this later to include components if needed
  checkers: ['typescript'],
  typescriptChecker: {
    prioritizePerformanceOverAccuracy: true,
  },
  // Mutation score threshold - start conservative, increase over time
  thresholds: {
    high: 80,
    low: 70,
    break: 60,
  },
  // Timeout for each test run (in milliseconds)
  timeoutMS: 60000,
  // Number of concurrent test runners
  concurrency: 2,
  // Log level
  logLevel: 'info',
  // Ignore patterns
  ignorePatterns: [
    'node_modules',
    'dist',
    'coverage',
    'storybook-static',
    'test-results',
    'playwright-report',
  ],
};

