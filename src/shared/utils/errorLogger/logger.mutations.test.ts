/**
 * Mutation-killing tests for logger.ts
 *
 * Target: MethodExpression L12 Math.random().toString(36)
 * If mutated (e.g., replaced with ""), the log ID random suffix would be missing or empty.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { info, getLogs } from './logger';
import { clearErrorLogs } from './storage';

describe('logger mutation tests — generateLogId random suffix', () => {
  beforeEach(() => {
    localStorage.clear();
    clearErrorLogs();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates log ID with alphanumeric random suffix from base-36 encoding', () => {
    info('test');
    const logs = getLogs();
    const id = logs[0].id;

    // Format: {timestamp}-{base36RandomChars}
    const dashIndex = id.indexOf('-');
    expect(dashIndex).toBeGreaterThan(0);

    const randomPart = id.substring(dashIndex + 1);
    // Math.random().toString(36).substring(2, 9) produces 1-7 alphanumeric chars
    expect(randomPart.length).toBeGreaterThan(0);
    expect(randomPart).toMatch(/^[a-z0-9]+$/);
  });

  it('generates different IDs for consecutive log entries (randomness check)', () => {
    // With Math.random(), consecutive calls should produce different IDs
    // If the random part is removed/mutated to a constant, IDs could collide
    // (unless timestamp differs, so we create them in quick succession)
    const ids = new Set<string>();
    for (let i = 0; i < 10; i++) {
      info(`message ${i}`);
    }
    const logs = getLogs();
    for (const log of logs) {
      ids.add(log.id);
    }
    // All 10 IDs should be unique
    expect(ids.size).toBe(10);
  });
});
