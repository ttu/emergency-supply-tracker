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
  const isCI = process.env.CI === 'true';
  let shouldLog = false;

  // Check for explicit env var first
  if (envSeed) {
    seed = Number.parseInt(envSeed, 10);
    // Log once when using explicit seed (first project to run)
    if (!fs.existsSync(SEED_FILE)) {
      fs.writeFileSync(SEED_FILE, String(seed));
      shouldLog = true;
    }
  } else if (fs.existsSync(SEED_FILE)) {
    // Reuse seed from earlier project in this test run
    seed = Number.parseInt(fs.readFileSync(SEED_FILE, 'utf-8'), 10);
  } else {
    // Generate new seed and save for other projects
    seed = Math.floor(Math.random() * 1000000);
    fs.writeFileSync(SEED_FILE, String(seed));
    shouldLog = true;
  }

  // Log seed once at start of test run (not in CI unless explicit seed)
  if (shouldLog && !isCI) {
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
