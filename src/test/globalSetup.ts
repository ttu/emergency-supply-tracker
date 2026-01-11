import {
  resolveFakerSeed,
  logSeed,
  incrementCounter,
  cleanupSeedFiles,
} from './fakerSeed';

// Type for globalSetup context - provides mechanism to share data with test workers
interface GlobalSetupContext {
  provide: <T extends keyof import('vitest').ProvidedContext>(
    key: T,
    value: import('vitest').ProvidedContext[T],
  ) => void;
}

// Expected number of projects (unit + storybook)
// Can be overridden via VITEST_PROJECT_COUNT env var
const EXPECTED_PROJECT_COUNT = (() => {
  const parsed = Number.parseInt(process.env.VITEST_PROJECT_COUNT ?? '2', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 2;
})();

/**
 * Vitest global setup - runs once before all tests
 * Used to generate a single faker seed for the entire test run
 *
 * Uses a temp file to coordinate seed across multiple Vitest projects/workers.
 */
export default function globalSetup({ provide }: GlobalSetupContext): void {
  const envSeed = process.env.FAKER_SEED;
  const isCI = Boolean(process.env.CI);
  const hasExplicitSeed = Boolean(envSeed);

  const { seed, shouldLog } = resolveFakerSeed(envSeed);

  logSeed(seed, shouldLog, { isCI, hasExplicitSeed });

  // Provide seed to all workers via Vitest's provide mechanism
  provide('fakerSeed', seed);
}

/**
 * Cleanup: remove seed file after test run
 * Coordinates across multiple projects to only delete when the last project finishes.
 */
export function teardown(): void {
  try {
    const completedCount = incrementCounter(EXPECTED_PROJECT_COUNT);

    if (completedCount >= EXPECTED_PROJECT_COUNT) {
      cleanupSeedFiles();
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
      console.warn('[Faker] Teardown error:', error);
    }
  }
}
