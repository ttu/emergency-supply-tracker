/**
 * Additional mutation-killing tests for errorLogger/storage.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getErrorLogData,
  saveErrorLogData,
  ERROR_LOG_STORAGE_KEY,
} from './storage';
import type { ErrorLogData, LogEntry } from './types';

beforeEach(() => {
  localStorage.clear();
});

// ============================================================================
// L23: ConditionalExpression - !entry || typeof entry !== 'object' → false
// Kills: guard that validates log entry structure
// ============================================================================
describe('L23: isValidLogEntry guard', () => {
  it('rejects null log entries in stored data', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const invalidData = {
      logs: [
        null,
        { id: '1', level: 'info', message: 'test', timestamp: '2024-01-01' },
      ],
      sessionId: 'test-session',
      sessionStart: '2024-01-01T00:00:00.000Z',
    };
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(invalidData));

    const result = getErrorLogData();
    // null entry should be filtered out
    expect(result.logs.length).toBe(1);
    expect(result.logs[0].message).toBe('test');
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// L27: ConditionalExpression - typeof e.level === 'string' → true
// Kills: would accept non-string levels
// ============================================================================
describe('L27: log level validation', () => {
  it('rejects entries with non-string level', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const invalidData = {
      logs: [
        { id: '1', level: 42, message: 'test', timestamp: '2024-01-01' },
        { id: '2', level: 'info', message: 'valid', timestamp: '2024-01-01' },
      ],
      sessionId: 'test-session',
      sessionStart: '2024-01-01T00:00:00.000Z',
    };
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(invalidData));

    const result = getErrorLogData();
    // Entry with numeric level should be filtered out
    expect(result.logs.length).toBe(1);
    expect(result.logs[0].message).toBe('valid');
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// L38: ConditionalExpression/LogicalOperator - isValidErrorLogData checks
// !data || typeof data !== 'object' → false
// && → || for the compound condition
// ============================================================================
describe('L38: isValidErrorLogData validation', () => {
  it('handles invalid JSON structure in localStorage', () => {
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, '"not an object"');

    const result = getErrorLogData();
    // String is not a valid error log structure
    expect(result.logs).toEqual([]);
    expect(result.sessionId).toBeDefined();
  });

  it('handles missing logs array', () => {
    localStorage.setItem(
      ERROR_LOG_STORAGE_KEY,
      JSON.stringify({ sessionId: 'test' }),
    );

    const result = getErrorLogData();
    // Missing logs array -> invalid structure
    expect(result.logs).toEqual([]);
  });
});

// ============================================================================
// L57: StringLiteral/MethodExpression - generateSessionId
// Math.random().toString(36).substring(2, 9) → '' or different method
// ============================================================================
describe('L57: session ID generation', () => {
  it('generates a non-empty session ID', () => {
    const result = getErrorLogData();
    expect(result.sessionId).toBeTruthy();
    expect(result.sessionId.length).toBeGreaterThan(0);
    // Session ID format: timestamp-random
    expect(result.sessionId).toMatch(/^\d+-\w+$/);
  });
});

// ============================================================================
// L132: ConditionalExpression/EqualityOperator
// data.logs.length > MAX_LOG_ENTRIES → true or >= MAX_LOG_ENTRIES
// ============================================================================
describe('L132: saveErrorLogData log trimming', () => {
  it('saves log data without trimming when under max entries', () => {
    const data: ErrorLogData = {
      logs: [
        {
          id: '1',
          level: 'info',
          message: 'test',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ],
      sessionId: 'test-session',
      sessionStart: '2024-01-01T00:00:00.000Z',
    };

    saveErrorLogData(data);

    const stored = JSON.parse(
      localStorage.getItem(ERROR_LOG_STORAGE_KEY) || '{}',
    ) as ErrorLogData;
    expect(stored.logs.length).toBe(1);
    expect(stored.logs[0].message).toBe('test');
  });

  it('preserves all logs when exactly at max entries (500)', () => {
    // MAX_LOG_ENTRIES is 500
    const logs: LogEntry[] = Array.from({ length: 500 }, (_, i) => ({
      id: `entry-${i}`,
      level: 'info' as const,
      message: `Log ${i}`,
      timestamp: '2024-01-01T00:00:00.000Z',
    }));

    const data: ErrorLogData = {
      logs,
      sessionId: 'test-session',
      sessionStart: '2024-01-01T00:00:00.000Z',
    };

    saveErrorLogData(data);

    const stored = JSON.parse(
      localStorage.getItem(ERROR_LOG_STORAGE_KEY) || '{}',
    ) as ErrorLogData;
    // Exactly at limit: should NOT trim
    // If mutant changes > to >=, would trim at exactly 500
    expect(stored.logs.length).toBe(500);
  });
});

// ============================================================================
// L48: ConditionalExpression - d.sessionId !== undefined check → true
// ============================================================================
describe('L48: optional field validation', () => {
  it('accepts data without sessionId', () => {
    const validData = {
      logs: [],
    };
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(validData));

    const result = getErrorLogData();
    // Missing sessionId is OK (will use current session)
    expect(result.sessionId).toBeDefined();
  });

  it('rejects data with non-string sessionId', () => {
    const invalidData = {
      logs: [],
      sessionId: 42,
    };
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(invalidData));

    const result = getErrorLogData();
    // Non-string sessionId should fail validation -> fresh data
    expect(result.logs).toEqual([]);
    expect(typeof result.sessionId).toBe('string');
    expect(result.sessionId).not.toBe(42);
  });
});
