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
export const LOG_FILE = `${FILE_PREFIX}-log`;

/**
 * Validates and parses a seed string.
 * Strictly validates that the input is a non-negative integer string (no decimals, no suffixes).
 * @throws TypeError if seed is invalid
 */
export function validateAndParseSeed(seedString: string): number {
  const trimmed = seedString.trim();
  // Strict validation: only digits, 1-6 chars, no decimals or suffixes
  if (!/^\d{1,6}$/.test(trimmed)) {
    throw new TypeError(
      `[Faker] Invalid FAKER_SEED="${seedString}". Expected an integer in range 0-999999.`,
    );
  }
  const parsedSeed = Number(trimmed);
  if (parsedSeed > 999999) {
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

// --- Counter management for coordinated teardown (token files) ---

// Directory for counter token files - avoids read-modify-write race conditions
const COUNTER_DIR = `${FILE_PREFIX}-counter.d`;

/**
 * Atomically increments the project completion counter using token files.
 * Each project creates a unique token file in a directory. The count is
 * determined by the number of files in the directory.
 *
 * This approach is race-condition free because each project creates its own
 * unique file using atomic file creation (O_CREAT|O_EXCL via 'wx' flag).
 */
export function incrementCounter(expectedProjectCount: number): number {
  try {
    // Create counter directory if it doesn't exist
    fs.mkdirSync(COUNTER_DIR, { recursive: true });

    // Create a unique token file for this project
    const tokenFile = path.join(
      COUNTER_DIR,
      `${process.pid}-${crypto.randomUUID()}`,
    );
    fs.writeFileSync(tokenFile, '', { flag: 'wx' });

    // Count token files to determine completion count
    const count = fs.readdirSync(COUNTER_DIR).length;
    return Math.min(count, expectedProjectCount);
  } catch {
    // If counting fails, be conservative: report "done" to avoid blocking cleanup
    return expectedProjectCount;
  }
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
 * Performs cleanup of seed, counter directory, and log files.
 */
export function cleanupSeedFiles(): void {
  safeUnlink(SEED_FILE, 'seed file');
  safeUnlink(LOG_FILE, 'log file');

  // Remove counter directory and all token files
  try {
    if (fs.existsSync(COUNTER_DIR)) {
      fs.rmSync(COUNTER_DIR, { recursive: true, force: true });
    }
  } catch {
    // Cleanup is best-effort
  }
}
