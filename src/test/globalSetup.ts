import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { GlobalSetupContext } from 'vitest/node';

// File to store seed for this test run (unique per process tree)
const SEED_FILE = path.join(os.tmpdir(), `.vitest-faker-seed-${process.ppid}`);

/**
 * Vitest global setup - runs once before all tests
 * Used to generate a single faker seed for the entire test run
 *
 * Uses a temp file to coordinate seed across multiple Vitest projects/workers.
 */
export default function globalSetup({ provide }: GlobalSetupContext) {
  let seed: number;

  const envSeed = process.env.FAKER_SEED;
  const isCI = Boolean(process.env.CI);
  let shouldLog = false;
  const hasExplicitSeed = Boolean(envSeed);

  // Check for explicit env var first
  if (envSeed) {
    seed = Number.parseInt(envSeed, 10);
    if (Number.isNaN(seed)) {
      throw new Error(
        `Invalid FAKER_SEED value: "${envSeed}". Must be a valid integer.`,
      );
    }
    // Log once when using explicit seed (first project to run)
    // Use exclusive flag to avoid race condition with parallel projects
    try {
      fs.writeFileSync(SEED_FILE, String(seed), { flag: 'wx' });
      shouldLog = true;
    } catch {
      // File already exists, another project created it first
    }
  } else if (fs.existsSync(SEED_FILE)) {
    // Reuse seed from earlier project in this test run
    seed = Number.parseInt(fs.readFileSync(SEED_FILE, 'utf-8'), 10);
  } else {
    // Generate new seed and save for other projects
    // Use exclusive flag to avoid race condition with parallel projects
    seed = Math.floor(Math.random() * 1000000);
    try {
      fs.writeFileSync(SEED_FILE, String(seed), { flag: 'wx' });
      shouldLog = true;
    } catch {
      // File already exists from another project, read their seed instead
      seed = Number.parseInt(fs.readFileSync(SEED_FILE, 'utf-8'), 10);
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
 * Cleanup: remove seed file after test run
 */
export function teardown() {
  try {
    if (fs.existsSync(SEED_FILE)) {
      fs.unlinkSync(SEED_FILE);
    }
  } catch {
    // Ignore cleanup errors
  }
}
