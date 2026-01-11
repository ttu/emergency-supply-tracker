import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import type { GlobalSetupContext } from 'vitest/node';

// Generate a unique scope based on the repository directory to avoid collisions
// across different repos or parallel runs from the same parent process
const RUN_SCOPE = crypto
  .createHash('sha256')
  .update(process.cwd())
  .digest('hex')
  .slice(0, 12);

// File to store seed for this test run (scoped by repo and process tree)
const SEED_FILE = path.join(
  os.tmpdir(),
  `.vitest-faker-seed-${RUN_SCOPE}-${process.pid}`,
);
// File to track project completion count for coordinated teardown
const COUNTER_FILE = path.join(
  os.tmpdir(),
  `.vitest-faker-counter-${RUN_SCOPE}-${process.pid}`,
);
// File to ensure we only log the seed once per run (even with explicit FAKER_SEED)
const LOG_FILE = path.join(
  os.tmpdir(),
  `.vitest-faker-seed-log-${RUN_SCOPE}-${process.pid}`,
);
// Expected number of projects (unit + storybook)
// Can be overridden via VITEST_PROJECT_COUNT env var
const EXPECTED_PROJECT_COUNT = (() => {
  const parsed = Number.parseInt(process.env.VITEST_PROJECT_COUNT ?? '2', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 2;
})();

/**
 * Validates and parses FAKER_SEED environment variable.
 * @throws TypeError if seed is invalid
 */
function validateAndParseSeed(envSeed: string): number {
  const parsedSeed = Number.parseInt(envSeed, 10);
  if (
    !Number.isInteger(parsedSeed) ||
    Number.isNaN(parsedSeed) ||
    parsedSeed < 0 ||
    parsedSeed > 999999
  ) {
    throw new TypeError(
      `[Faker] Invalid FAKER_SEED="${envSeed}". Expected an integer in range 0-999999.`,
    );
  }
  return parsedSeed;
}

/**
 * Attempts to write seed file atomically. Returns true if file was created.
 * Handles EEXIST errors gracefully (expected in parallel execution).
 */
function tryWriteSeedFile(seed: number): boolean {
  try {
    fs.writeFileSync(SEED_FILE, String(seed), { flag: 'wx' });
    return true;
  } catch (error) {
    // File already exists (EEXIST), another project created it first
    // This is expected in parallel test execution - ignore the error
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      // Re-throw unexpected errors
      throw error;
    }
    return false;
  }
}

/**
 * Reads seed from existing seed file.
 * Validates the seed to ensure it's a valid integer.
 */
function readSeedFromFile(): number {
  const content = fs.readFileSync(SEED_FILE, 'utf-8').trim();
  return validateAndParseSeed(content);
}

/**
 * Generates a new random seed.
 */
function generateRandomSeed(): number {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Attempts to claim the log file to ensure we only log once per run.
 * Returns true if this process should log.
 */
function tryClaimLogFile(): boolean {
  try {
    fs.writeFileSync(LOG_FILE, '', { flag: 'wx' });
    return true;
  } catch {
    // Another project already logged, don't log again
    return false;
  }
}

/**
 * Handles explicit seed from environment variable.
 * Returns the seed and whether it should be logged.
 */
function handleExplicitSeed(envSeed: string): {
  seed: number;
  shouldLog: boolean;
} {
  const seed = validateAndParseSeed(envSeed);
  // Ensure the shared file matches the explicit seed (avoid stale/collision mismatch)
  // Explicit seed should dominate to maintain consistency across projects
  if (!fs.existsSync(SEED_FILE)) {
    return { seed, shouldLog: tryWriteSeedFile(seed) };
  }

  const existing = readSeedFromFile();
  if (existing === seed) {
    // File exists and matches - still log once for explicit seeds
    return { seed, shouldLog: tryClaimLogFile() };
  }

  // Overwrite with explicit seed to ensure all projects use the same seed
  fs.writeFileSync(SEED_FILE, String(seed), { flag: 'w' });
  return { seed, shouldLog: true };
}

/**
 * Handles seed when no explicit seed is provided.
 * Returns the seed and whether it should be logged.
 */
function handleImplicitSeed(): { seed: number; shouldLog: boolean } {
  if (fs.existsSync(SEED_FILE)) {
    // Reuse seed from earlier project in this test run
    return { seed: readSeedFromFile(), shouldLog: false };
  }

  // Generate new seed and save for other projects
  const seed = generateRandomSeed();
  const shouldLog = tryWriteSeedFile(seed);
  // If file already exists, another project created it - read their seed
  if (shouldLog) {
    return { seed, shouldLog: true };
  }
  return { seed: readSeedFromFile(), shouldLog: false };
}

/**
 * Vitest global setup - runs once before all tests
 * Used to generate a single faker seed for the entire test run
 *
 * Uses a temp file to coordinate seed across multiple Vitest projects/workers.
 */
export default function globalSetup({ provide }: GlobalSetupContext) {
  const envSeed = process.env.FAKER_SEED;
  const isCI = Boolean(process.env.CI);
  const hasExplicitSeed = Boolean(envSeed);

  const { seed, shouldLog } = envSeed
    ? handleExplicitSeed(envSeed)
    : handleImplicitSeed();

  // Log seed once at start of test run (not in CI unless explicit seed is set)
  if (shouldLog && (!isCI || hasExplicitSeed)) {
    process.stderr.write(
      `\n[Faker] Using seed: ${seed} (set FAKER_SEED=${seed} to reproduce)\n\n`,
    );
  }

  // Provide seed to all workers via Vitest's provide mechanism
  provide('fakerSeed', seed);
}

/**
 * Attempts to create a new counter file atomically.
 * Returns the counter value (1) if successful, null if file already exists.
 */
function tryCreateCounterFile(): number | null {
  try {
    fs.writeFileSync(COUNTER_FILE, '1', { flag: 'wx' });
    return 1;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      return null; // File exists, need to read and increment
    }
    throw error; // Unexpected error
  }
}

/**
 * Reads the current counter value from file.
 * Returns the counter value, or null if file is invalid/corrupted.
 */
function readCounterValue(): number | null {
  try {
    const content = fs.readFileSync(COUNTER_FILE, 'utf-8').trim();
    const current = Number.parseInt(content, 10);
    if (Number.isNaN(current) || current < 1) {
      // Invalid counter, reset to 1
      fs.writeFileSync(COUNTER_FILE, '1', { flag: 'w' });
      return 1;
    }
    return current;
  } catch {
    // File was deleted or corrupted
    return null;
  }
}

/**
 * Increments the counter value and writes it back to file atomically.
 * Uses a temporary file and atomic rename to prevent race conditions.
 * Returns the new counter value, or null if write failed.
 */
function writeIncrementedCounter(current: number): number | null {
  const next = current + 1;
  const tempFile = `${COUNTER_FILE}.${process.pid}.tmp`;
  try {
    // Write to temporary file first
    fs.writeFileSync(tempFile, String(next), { flag: 'w' });
    // Atomically rename temp file over the counter file
    fs.renameSync(tempFile, COUNTER_FILE);
    return next;
  } catch {
    // Write or rename failed - clean up temp file if it exists
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Handles the case when counter file already exists.
 * Reads, validates, increments, and writes back.
 * Returns the new counter value, or null if operation failed.
 */
function handleExistingCounterFile(): number | null {
  const current = readCounterValue();
  if (current === null) {
    return null; // File invalid or corrupted, retry
  }
  return writeIncrementedCounter(current);
}

/**
 * Performs a brief delay for exponential backoff.
 */
function delay(attempts: number): void {
  const delayMs = Math.min(5 * attempts, 50);
  const start = Date.now();
  while (Date.now() - start < delayMs) {
    // Busy wait (acceptable for short delays in test teardown)
  }
}

/**
 * Atomically increments the project completion counter.
 * Returns the new counter value after increment.
 *
 * Uses retry logic with exponential backoff to handle race conditions
 * when multiple projects complete simultaneously.
 */
function incrementCounter(): number {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    try {
      const newCounter = tryCreateCounterFile();
      if (newCounter !== null) {
        return newCounter;
      }

      // File exists, need to read and increment
      const incremented = handleExistingCounterFile();
      if (incremented !== null) {
        return incremented;
      }

      // Operation failed, retry
      attempts++;
      delay(attempts);
    } catch {
      attempts++;
      if (attempts >= maxAttempts) {
        // After max attempts, assume we're the last one
        return EXPECTED_PROJECT_COUNT;
      }
      delay(attempts);
    }
  }

  // Fallback: assume we're the last project to prevent hanging
  return EXPECTED_PROJECT_COUNT;
}

/**
 * Safely removes a file if it exists.
 * Logs warnings in development but never throws.
 */
function safeUnlink(filePath: string, fileDescription: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    // Log but don't throw - cleanup errors shouldn't fail tests
    if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
      console.warn(`[Faker] Failed to cleanup ${fileDescription}:`, error);
    }
  }
}

/**
 * Performs cleanup of seed, counter, and log files.
 * Only called when this is the last project to finish.
 */
function performCleanup(): void {
  safeUnlink(SEED_FILE, 'seed file');
  safeUnlink(COUNTER_FILE, 'counter file');
  safeUnlink(LOG_FILE, 'log file');
}

/**
 * Checks if cleanup should be performed based on completion count.
 */
function shouldPerformCleanup(completedCount: number): boolean {
  return completedCount >= EXPECTED_PROJECT_COUNT;
}

/**
 * Cleanup: remove seed file after test run
 * Coordinates across multiple projects to only delete when the last project finishes.
 */
export function teardown() {
  try {
    // Increment the completion counter atomically
    const completedCount = incrementCounter();

    // Only the last project should delete the seed file
    if (shouldPerformCleanup(completedCount)) {
      performCleanup();
    }
    // If not the last project, leave SEED_FILE intact for other projects
  } catch (error) {
    // Ignore teardown errors - they shouldn't fail tests
    // Log in development for debugging
    if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
      console.warn('[Faker] Teardown error:', error);
    }
  }
}
