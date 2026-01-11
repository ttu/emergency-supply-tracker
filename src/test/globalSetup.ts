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
  `.vitest-faker-seed-${RUN_SCOPE}-${process.ppid}`,
);
// File to track project completion count for coordinated teardown
const COUNTER_FILE = path.join(
  os.tmpdir(),
  `.vitest-faker-counter-${RUN_SCOPE}-${process.ppid}`,
);
// Expected number of projects (unit + storybook)
// Can be overridden via VITEST_PROJECT_COUNT env var
const EXPECTED_PROJECT_COUNT = Number.parseInt(
  process.env.VITEST_PROJECT_COUNT ?? '2',
  10,
);

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
 */
function readSeedFromFile(): number {
  return Number.parseInt(fs.readFileSync(SEED_FILE, 'utf-8'), 10);
}

/**
 * Generates a new random seed.
 */
function generateRandomSeed(): number {
  return Math.floor(Math.random() * 1000000);
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

  let seed: number;
  let shouldLog = false;

  // Check for explicit env var first
  if (envSeed) {
    seed = validateAndParseSeed(envSeed);
    // Ensure the shared file matches the explicit seed (avoid stale/collision mismatch)
    // Explicit seed should dominate to maintain consistency across projects
    if (fs.existsSync(SEED_FILE)) {
      const existing = readSeedFromFile();
      if (existing !== seed) {
        // Overwrite with explicit seed to ensure all projects use the same seed
        fs.writeFileSync(SEED_FILE, String(seed), { flag: 'w' });
        shouldLog = true;
      }
    } else {
      shouldLog = tryWriteSeedFile(seed);
    }
  } else if (fs.existsSync(SEED_FILE)) {
    // Reuse seed from earlier project in this test run
    seed = readSeedFromFile();
  } else {
    // Generate new seed and save for other projects
    seed = generateRandomSeed();
    shouldLog = tryWriteSeedFile(seed);
    // If file already exists, another project created it - read their seed
    if (!shouldLog) {
      seed = readSeedFromFile();
    }
  }

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
      // Try to create counter file with exclusive flag (atomic creation)
      try {
        fs.writeFileSync(COUNTER_FILE, '1', { flag: 'wx' });
        return 1;
      } catch (error) {
        // File exists, need to read and increment
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
          // Read current value
          let current: number;
          try {
            const content = fs.readFileSync(COUNTER_FILE, 'utf-8').trim();
            current = Number.parseInt(content, 10);
            if (Number.isNaN(current) || current < 1) {
              // Invalid counter, reset to 1
              fs.writeFileSync(COUNTER_FILE, '1', { flag: 'w' });
              return 1;
            }
          } catch {
            // File was deleted or corrupted, retry from beginning
            attempts++;
            continue;
          }

          // Increment and write back
          // Note: This read-modify-write isn't fully atomic, but the retry
          // mechanism and >= check in teardown() handle race conditions gracefully
          const next = current + 1;
          try {
            fs.writeFileSync(COUNTER_FILE, String(next), { flag: 'w' });
            return next;
          } catch {
            // Write failed (file might have been deleted), retry
            attempts++;
            continue;
          }
        }
        // Unexpected error, retry
        attempts++;
        continue;
      }
    } catch {
      attempts++;
      if (attempts >= maxAttempts) {
        // After max attempts, assume we're the last one
        // This is a fallback to prevent hanging
        return EXPECTED_PROJECT_COUNT;
      }
      // Brief delay before retry (exponential backoff)
      // Use synchronous sleep for Node.js compatibility
      const delay = Math.min(5 * attempts, 50);
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Busy wait (acceptable for short delays in test teardown)
      }
    }
  }
  // Fallback: assume we're the last project to prevent hanging
  return EXPECTED_PROJECT_COUNT;
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
    if (completedCount >= EXPECTED_PROJECT_COUNT) {
      // Clean up both seed file and counter file
      try {
        if (fs.existsSync(SEED_FILE)) {
          fs.unlinkSync(SEED_FILE);
        }
      } catch (error) {
        // Log but don't throw - cleanup errors shouldn't fail tests
        if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
          console.warn('[Faker] Failed to cleanup seed file:', error);
        }
      }

      try {
        if (fs.existsSync(COUNTER_FILE)) {
          fs.unlinkSync(COUNTER_FILE);
        }
      } catch (error) {
        // Log but don't throw - cleanup errors shouldn't fail tests
        if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
          console.warn('[Faker] Failed to cleanup counter file:', error);
        }
      }
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
