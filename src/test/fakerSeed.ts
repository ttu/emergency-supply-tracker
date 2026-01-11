/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// Generate a unique scope based on the repository directory to avoid collisions
// across different repos or parallel runs from the same parent process
const RUN_SCOPE = crypto
  .createHash('sha256')
  .update(process.cwd())
  .digest('hex')
  .slice(0, 12);

// File paths scoped by repo and process tree
const FILE_PREFIX = path.join(
  os.tmpdir(),
  `.vitest-faker-${RUN_SCOPE}-${process.pid}`,
);

export const SEED_FILE = `${FILE_PREFIX}-seed`;
export const COUNTER_FILE = `${FILE_PREFIX}-counter`;
export const LOG_FILE = `${FILE_PREFIX}-log`;

/**
 * Validates and parses a seed string.
 * @throws TypeError if seed is invalid
 */
export function validateAndParseSeed(seedString: string): number {
  const parsedSeed = Number.parseInt(seedString, 10);
  const isValidSeed =
    Number.isInteger(parsedSeed) && parsedSeed >= 0 && parsedSeed <= 999999;
  if (!isValidSeed) {
    throw new TypeError(
      `[Faker] Invalid FAKER_SEED="${seedString}". Expected an integer in range 0-999999.`,
    );
  }
  return parsedSeed;
}

/**
 * Generates a new random seed in the range 0-999999.
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Attempts to write seed file atomically. Returns true if file was created.
 * Handles EEXIST errors gracefully (expected in parallel execution).
 */
export function tryWriteSeedFile(seed: number): boolean {
  try {
    fs.writeFileSync(SEED_FILE, String(seed), { flag: 'wx' });
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
    return false;
  }
}

/**
 * Reads seed from existing seed file.
 * Validates the seed to ensure it's a valid integer.
 */
export function readSeedFromFile(): number {
  const content = fs.readFileSync(SEED_FILE, 'utf-8').trim();
  return validateAndParseSeed(content);
}

/**
 * Attempts to claim the log file to ensure we only log once per run.
 * Returns true if this process should log.
 */
export function tryClaimLogFile(): boolean {
  try {
    fs.writeFileSync(LOG_FILE, '', { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Handles explicit seed from environment variable.
 * Returns the seed and whether it should be logged.
 */
export function handleExplicitSeed(envSeed: string): {
  seed: number;
  shouldLog: boolean;
} {
  const seed = validateAndParseSeed(envSeed);

  if (!fs.existsSync(SEED_FILE)) {
    return { seed, shouldLog: tryWriteSeedFile(seed) };
  }

  const existing = readSeedFromFile();
  if (existing === seed) {
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
export function handleImplicitSeed(): { seed: number; shouldLog: boolean } {
  if (fs.existsSync(SEED_FILE)) {
    return { seed: readSeedFromFile(), shouldLog: false };
  }

  const seed = generateRandomSeed();
  const wasCreated = tryWriteSeedFile(seed);

  return wasCreated
    ? { seed, shouldLog: true }
    : { seed: readSeedFromFile(), shouldLog: false };
}

/**
 * Resolves the faker seed for the test run.
 * Coordinates across multiple Vitest projects/workers using temp files.
 */
export function resolveFakerSeed(envSeed: string | undefined): {
  seed: number;
  shouldLog: boolean;
} {
  return envSeed ? handleExplicitSeed(envSeed) : handleImplicitSeed();
}

/**
 * Logs the seed to stderr if conditions are met.
 */
export function logSeed(
  seed: number,
  shouldLog: boolean,
  options: { isCI: boolean; hasExplicitSeed: boolean },
): void {
  if (shouldLog && (!options.isCI || options.hasExplicitSeed)) {
    process.stderr.write(
      `\n[Faker] Using seed: ${seed} (set FAKER_SEED=${seed} to reproduce)\n\n`,
    );
  }
}

// --- Counter management for coordinated teardown ---

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
      return null;
    }
    throw error;
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
      fs.writeFileSync(COUNTER_FILE, '1', { flag: 'w' });
      return 1;
    }
    return current;
  } catch {
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
    fs.writeFileSync(tempFile, String(next), { flag: 'w' });
    fs.renameSync(tempFile, COUNTER_FILE);
    return next;
  } catch {
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Cleanup is best-effort
      }
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
    return null;
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
export function incrementCounter(expectedProjectCount: number): number {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    try {
      const newCounter = tryCreateCounterFile();
      if (newCounter !== null) {
        return newCounter;
      }

      const incremented = handleExistingCounterFile();
      if (incremented !== null) {
        return incremented;
      }

      attempts++;
      delay(attempts);
    } catch {
      attempts++;
      if (attempts >= maxAttempts) {
        return expectedProjectCount;
      }
      delay(attempts);
    }
  }

  return expectedProjectCount;
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
    if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
      console.warn(`[Faker] Failed to cleanup ${fileDescription}:`, error);
    }
  }
}

/**
 * Performs cleanup of seed, counter, and log files.
 */
export function cleanupSeedFiles(): void {
  safeUnlink(SEED_FILE, 'seed file');
  safeUnlink(COUNTER_FILE, 'counter file');
  safeUnlink(LOG_FILE, 'log file');
}
