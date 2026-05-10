/**
 * Mutation-killing tests for storage.ts
 *
 * Targets surviving mutants in isValidLogEntry, isValidErrorLogData,
 * generateSessionId, and saveErrorLogData trimming logic.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getErrorLogData,
  saveErrorLogData,
  getSessionInfo,
  ERROR_LOG_STORAGE_KEY,
} from './storage';
import type { ErrorLogData, LogEntry } from './types';

describe('storage mutation killing tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isValidLogEntry guard (L23): null/undefined/non-object rejection', () => {
    // Kills: ConditionalExpression L23 false, LogicalOperator L23 && -> ||
    // The mutant replaces `if (!entry || typeof entry !== 'object') return false`
    // with always-false (never returns false) or changes || to &&.
    // We need to verify that falsy non-object values are rejected AND
    // that valid objects are accepted (to distinguish from always-true).

    it('rejects undefined entries in logs array', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({ logs: [undefined] }),
      );
      // JSON.stringify converts undefined in array to null, so this tests null
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('rejects numeric entries in logs array', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({ logs: [42] }),
      );
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('rejects boolean entries in logs array', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({ logs: [false] }),
      );
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('accepts a fully valid entry (distinguishes from always-false mutant)', () => {
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 'v1',
              level: 'error',
              message: 'msg',
              timestamp: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      );
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].id).toBe('v1');
    });

    it('rejects null entry while accepting valid entry in same array', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            null,
            {
              id: 'v1',
              level: 'warn',
              message: 'ok',
              timestamp: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      );
      const data = getErrorLogData();
      // null must be rejected, valid must be kept
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].id).toBe('v1');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('isValidLogEntry L27: level string type check', () => {
    // Kills: ConditionalExpression L27 true (typeof e.level === 'string' -> true)
    // If mutated to true, then VALID_LOG_LEVELS.includes would receive a non-string.
    // For primitive arrays, includes uses SameValueZero which won't match number to string.
    // BUT: if level is boolean `true` or an object, includes still returns false.
    // The real question is: can we construct an entry that passes if the check is
    // replaced with `true`? Only if includes also passes — which it won't for non-strings.
    // So this mutant might be equivalent... but let's write a test anyway to be sure
    // the typeof check matters independently.

    it('rejects entry with level as array (object type, not string)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 'test',
              level: ['error'],
              message: 'test',
              timestamp: '2024-01-01',
            },
          ],
        }),
      );
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(0);
      consoleSpy.mockRestore();
    });
  });

  describe('isValidErrorLogData guard (L38): null/non-object rejection', () => {
    // Kills: ConditionalExpression L38 false (x2), LogicalOperator L38 && -> ||,
    // BooleanLiteral L38 true (return false -> return true)

    it('rejects stored data that is a JSON array (not object)', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify([1, 2, 3]));
      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid error log data structure in localStorage, resetting to defaults',
      );
      consoleSpy.mockRestore();
    });

    it('rejects stored data that is a JSON string', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify('just a string'),
      );
      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid error log data structure in localStorage, resetting to defaults',
      );
      consoleSpy.mockRestore();
    });

    it('rejects stored data that is a JSON number', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(42));
      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid error log data structure in localStorage, resetting to defaults',
      );
      consoleSpy.mockRestore();
    });

    it('rejects stored data that is JSON false (falsy non-object)', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(false));
      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('rejects stored data that is JSON null', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, 'null');
      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('accepts valid ErrorLogData structure (distinguishes from always-false)', () => {
      const stored: ErrorLogData = {
        logs: [
          {
            id: 'v1',
            level: 'info',
            message: 'test',
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
        sessionId: 'sess-1',
        sessionStart: '2024-01-01T00:00:00Z',
      };
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(stored));
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(1);
      expect(data.sessionId).toBe('sess-1');
    });
  });

  describe('isValidErrorLogData L48: sessionStart non-string check', () => {
    // Kills: BooleanLiteral L48 true (return false -> return true)
    // If mutant changes `return false` to `return true` on L48,
    // then non-string sessionStart would be accepted as valid.
    // We need to verify the data is actually rejected (logs reset to empty).

    it('rejects data where sessionStart is a number and resets logs', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 'should-be-lost',
              level: 'error',
              message: 'this log should be discarded',
              timestamp: '2024-01-01',
            },
          ],
          sessionStart: 12345,
        }),
      );
      const data = getErrorLogData();
      // If the mutant returns true instead of false, the invalid data would be
      // accepted and the log entry would be preserved. We verify it's rejected.
      expect(data.logs).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid error log data structure in localStorage, resetting to defaults',
      );
      consoleSpy.mockRestore();
    });

    it('rejects data where sessionStart is boolean', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 'x',
              level: 'info',
              message: 'msg',
              timestamp: '2024-01-01',
            },
          ],
          sessionStart: true,
        }),
      );
      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('generateSessionId (L57): format and content', () => {
    // Kills: StringLiteral L57 empty, MethodExpression L57 Math.random().toString(36)

    it('generates session ID with non-empty random suffix', () => {
      const session = getSessionInfo();
      // Format: timestamp-randomChars
      const parts = session.id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(2);
      // First part is numeric timestamp
      expect(Number(parts[0])).toBeGreaterThan(0);
      // Second part is the random alphanumeric suffix (base-36)
      const randomPart = parts.slice(1).join('-');
      expect(randomPart.length).toBeGreaterThan(0);
      // Should contain alphanumeric characters (base-36 produces [0-9a-z])
      expect(randomPart).toMatch(/^[a-z0-9]+$/);
    });

    it('generates session ID that is not empty string', () => {
      const session = getSessionInfo();
      expect(session.id).not.toBe('');
      expect(session.id.length).toBeGreaterThan(5);
    });

    it('generates session ID containing a hyphen separator', () => {
      const session = getSessionInfo();
      // The template literal `${Date.now()}-${...}` must contain a hyphen
      expect(session.id).toContain('-');
    });

    it('generates session ID with timestamp prefix that is a valid number', () => {
      const session = getSessionInfo();
      const timestampStr = session.id.split('-')[0];
      const timestamp = Number(timestampStr);
      expect(timestamp).not.toBeNaN();
      // Should be a reasonable timestamp (after year 2020)
      expect(timestamp).toBeGreaterThan(1577836800000);
    });
  });

  describe('saveErrorLogData L132: boundary trimming with > vs >=', () => {
    // Kills: EqualityOperator L132 > -> >=
    // When length === 500, `>` does NOT trim but `>=` WOULD trim.
    // The existing test checks length stays 500 but doesn't verify the FIRST entry
    // is preserved (i.e., no trimming happened). Let's be more precise.

    it('preserves all entries at exactly MAX_LOG_ENTRIES (500) - no trimming', () => {
      const session = getSessionInfo();
      const logs: LogEntry[] = Array.from({ length: 500 }, (_, i) => ({
        id: `entry-${i}`,
        level: 'debug' as const,
        message: `Log ${i}`,
        timestamp: '2024-01-01T00:00:00Z',
      }));

      saveErrorLogData({
        logs,
        sessionId: session.id,
        sessionStart: session.start,
      });

      const stored = localStorage.getItem(ERROR_LOG_STORAGE_KEY);
      const parsed = JSON.parse(stored!) as ErrorLogData;
      expect(parsed.logs).toHaveLength(500);
      // If >= mutant is active, slice(-500) would run but still return 500 items.
      // However, with slice(-500) the first item should still be entry-0.
      // Actually slice(-500) on a 500-length array returns the same array.
      // So we need to test with 500 entries and verify the identity is preserved.
      // The real difference: with >, 500 entries take the else branch (no slice).
      // With >=, 500 entries take the if branch (slice(-500)).
      // For 500 entries, slice(-500) returns all 500 — same result!
      // This mutant may be equivalent for length=500. Let's verify with identity check.
      expect(parsed.logs[0].id).toBe('entry-0');
      expect(parsed.logs[499].id).toBe('entry-499');
    });

    it('trims at 501 entries keeping last 500', () => {
      const session = getSessionInfo();
      const logs: LogEntry[] = Array.from({ length: 501 }, (_, i) => ({
        id: `entry-${i}`,
        level: 'debug' as const,
        message: `Log ${i}`,
        timestamp: '2024-01-01T00:00:00Z',
      }));

      saveErrorLogData({
        logs,
        sessionId: session.id,
        sessionStart: session.start,
      });

      const stored = localStorage.getItem(ERROR_LOG_STORAGE_KEY);
      const parsed = JSON.parse(stored!) as ErrorLogData;
      expect(parsed.logs).toHaveLength(500);
      // First entry should be entry-1 (entry-0 trimmed)
      expect(parsed.logs[0].id).toBe('entry-1');
      expect(parsed.logs[499].id).toBe('entry-500');
    });

    it('does not trim at 499 entries', () => {
      const session = getSessionInfo();
      const logs: LogEntry[] = Array.from({ length: 499 }, (_, i) => ({
        id: `entry-${i}`,
        level: 'debug' as const,
        message: `Log ${i}`,
        timestamp: '2024-01-01T00:00:00Z',
      }));

      saveErrorLogData({
        logs,
        sessionId: session.id,
        sessionStart: session.start,
      });

      const stored = localStorage.getItem(ERROR_LOG_STORAGE_KEY);
      const parsed = JSON.parse(stored!) as ErrorLogData;
      expect(parsed.logs).toHaveLength(499);
      expect(parsed.logs[0].id).toBe('entry-0');
    });
  });
});

// ============================================================================
// Merged from storage.behaviors2.test.ts
// ============================================================================

beforeEach(() => {
  localStorage.clear();
});

// ============================================================================
// L23: ConditionalExpression - !entry || typeof entry !== 'object' → false
// Kills: guard that validates log entry structure
// ============================================================================
describe('isValidLogEntry guard', () => {
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
describe('log level validation', () => {
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
describe('isValidErrorLogData validation', () => {
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
describe('session ID generation', () => {
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
describe('saveErrorLogData log trimming', () => {
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
describe('optional field validation', () => {
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
