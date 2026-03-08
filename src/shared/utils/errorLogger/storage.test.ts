import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getErrorLogData,
  saveErrorLogData,
  addLogEntry,
  getLogEntries,
  clearErrorLogs,
  getSessionInfo,
  ERROR_LOG_STORAGE_KEY,
} from './storage';
import type { ErrorLogData, LogEntry } from './types';

describe('errorLogger storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getErrorLogData', () => {
    it('returns default data when no data exists', () => {
      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      expect(data.sessionId).toBeDefined();
      expect(data.sessionStart).toBeDefined();
    });

    it('returns stored data when it exists', () => {
      const testEntry: LogEntry = {
        id: 'test-1',
        level: 'error',
        message: 'Test error',
        timestamp: new Date().toISOString(),
      };

      addLogEntry(testEntry);
      const data = getErrorLogData();

      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].message).toBe('Test error');
    });

    it('resets to defaults when localStorage contains invalid JSON', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, 'not valid json');

      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      expect(data.sessionId).toEqual(expect.any(String));
      expect(data.sessionStart).toEqual(expect.any(String));
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load error log data:',
        expect.any(SyntaxError),
      );
      consoleSpy.mockRestore();
    });

    it('resets to defaults when localStorage contains invalid structure', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify({ foo: 1 }));

      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid error log data structure in localStorage, resetting to defaults',
      );
      consoleSpy.mockRestore();
    });

    it('resets to defaults when data is null-like object', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, 'null');

      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('filters out invalid log entries and warns', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const stored: ErrorLogData = {
        logs: [
          {
            id: 'valid-1',
            level: 'info',
            message: 'Valid entry',
            timestamp: new Date().toISOString(),
          },
          // Invalid: missing message field
          { id: 'invalid-1', level: 'info', timestamp: '2024-01-01' } as never,
        ],
        sessionId: 'test-session',
        sessionStart: new Date().toISOString(),
      };
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(stored));

      const data = getErrorLogData();
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].id).toBe('valid-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Filtered out 1 invalid log entries',
      );
      consoleSpy.mockRestore();
    });

    it('does not warn when all entries are valid', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const stored: ErrorLogData = {
        logs: [
          {
            id: 'valid-1',
            level: 'info',
            message: 'Valid entry',
            timestamp: new Date().toISOString(),
          },
        ],
        sessionId: 'test-session',
        sessionStart: new Date().toISOString(),
      };
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(stored));

      const data = getErrorLogData();
      expect(data.logs).toHaveLength(1);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('preserves original sessionId and sessionStart from stored data', () => {
      const stored: ErrorLogData = {
        logs: [],
        sessionId: 'original-session-id',
        sessionStart: '2024-01-01T00:00:00.000Z',
      };
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(stored));

      const data = getErrorLogData();
      expect(data.sessionId).toBe('original-session-id');
      expect(data.sessionStart).toBe('2024-01-01T00:00:00.000Z');
    });

    it('uses current session when stored sessionId is empty string', () => {
      const stored: ErrorLogData = {
        logs: [],
        sessionId: '',
        sessionStart: '',
      };
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(stored));

      const data = getErrorLogData();
      const session = getSessionInfo();
      // Empty string is falsy, so || falls through to session
      expect(data.sessionId).toBe(session.id);
      expect(data.sessionStart).toBe(session.start);
    });

    it('rejects data where sessionId is non-string', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({ logs: [], sessionId: 123 }),
      );

      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid error log data structure in localStorage, resetting to defaults',
      );
      consoleSpy.mockRestore();
    });

    it('rejects data where sessionStart is non-string', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({ logs: [], sessionStart: 456 }),
      );

      const data = getErrorLogData();
      expect(data.logs).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('accepts data where sessionId and sessionStart are undefined', () => {
      localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify({ logs: [] }));

      const data = getErrorLogData();
      // undefined sessionId/sessionStart are valid, current session fills in
      expect(data.sessionId).toEqual(expect.any(String));
      expect(data.sessionStart).toEqual(expect.any(String));
    });
  });

  describe('isValidLogEntry via getErrorLogData filtering', () => {
    it('rejects entry where id is not a string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 123,
              level: 'info',
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

    it('rejects entry where level is not a string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 'test',
              level: 123,
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

    it('rejects entry where level is invalid string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 'test',
              level: 'invalid-level',
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

    it('rejects entry where message is not a string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 'test',
              level: 'info',
              message: 123,
              timestamp: '2024-01-01',
            },
          ],
        }),
      );
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('rejects entry where timestamp is not a string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({
          logs: [
            {
              id: 'test',
              level: 'info',
              message: 'test',
              timestamp: 123,
            },
          ],
        }),
      );
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('rejects null entry', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({ logs: [null] }),
      );
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('rejects non-object entry (string)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        ERROR_LOG_STORAGE_KEY,
        JSON.stringify({ logs: ['not an object'] }),
      );
      const data = getErrorLogData();
      expect(data.logs).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('accepts valid entry with all four valid log levels', () => {
      const levels = ['debug', 'info', 'warn', 'error'] as const;
      for (const level of levels) {
        localStorage.clear();
        localStorage.setItem(
          ERROR_LOG_STORAGE_KEY,
          JSON.stringify({
            logs: [
              {
                id: 'test',
                level,
                message: 'test',
                timestamp: '2024-01-01',
              },
            ],
          }),
        );
        const data = getErrorLogData();
        expect(data.logs).toHaveLength(1);
        expect(data.logs[0].level).toBe(level);
      }
    });
  });

  describe('saveErrorLogData', () => {
    it('stores data in localStorage', () => {
      const session = getSessionInfo();
      saveErrorLogData({
        logs: [
          {
            id: 'test-1',
            level: 'info',
            message: 'Test message',
            timestamp: new Date().toISOString(),
          },
        ],
        sessionId: session.id,
        sessionStart: session.start,
      });

      const stored = localStorage.getItem(ERROR_LOG_STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.logs).toHaveLength(1);
      expect(parsed.logs[0].id).toBe('test-1');
      expect(parsed.logs[0].message).toBe('Test message');
    });

    it('trims logs when exceeding max entries (500)', () => {
      const session = getSessionInfo();
      const manyLogs: LogEntry[] = Array.from({ length: 600 }, (_, i) => ({
        id: `test-${i}`,
        level: 'debug' as const,
        message: `Log entry ${i}`,
        timestamp: new Date().toISOString(),
      }));

      saveErrorLogData({
        logs: manyLogs,
        sessionId: session.id,
        sessionStart: session.start,
      });

      const data = getErrorLogData();
      expect(data.logs).toHaveLength(500);
      // Should keep the LAST 500 entries (slice(-500))
      expect(data.logs[0].id).toBe('test-100');
      expect(data.logs[499].id).toBe('test-599');
    });

    it('does not trim logs when exactly at max entries (500)', () => {
      const session = getSessionInfo();
      const logs: LogEntry[] = Array.from({ length: 500 }, (_, i) => ({
        id: `test-${i}`,
        level: 'debug' as const,
        message: `Log entry ${i}`,
        timestamp: new Date().toISOString(),
      }));

      saveErrorLogData({
        logs,
        sessionId: session.id,
        sessionStart: session.start,
      });

      const data = getErrorLogData();
      expect(data.logs).toHaveLength(500);
      expect(data.logs[0].id).toBe('test-0');
    });

    it('does not trim logs when under max entries', () => {
      const session = getSessionInfo();
      const logs: LogEntry[] = Array.from({ length: 499 }, (_, i) => ({
        id: `test-${i}`,
        level: 'debug' as const,
        message: `Log entry ${i}`,
        timestamp: new Date().toISOString(),
      }));

      saveErrorLogData({
        logs,
        sessionId: session.id,
        sessionStart: session.start,
      });

      const data = getErrorLogData();
      expect(data.logs).toHaveLength(499);
    });

    it('trims logs at exactly 501 entries', () => {
      const session = getSessionInfo();
      const logs: LogEntry[] = Array.from({ length: 501 }, (_, i) => ({
        id: `test-${i}`,
        level: 'debug' as const,
        message: `Log entry ${i}`,
        timestamp: new Date().toISOString(),
      }));

      saveErrorLogData({
        logs,
        sessionId: session.id,
        sessionStart: session.start,
      });

      const data = getErrorLogData();
      expect(data.logs).toHaveLength(500);
      expect(data.logs[0].id).toBe('test-1');
    });

    it('handles localStorage setItem failure gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const session = getSessionInfo();
      saveErrorLogData({
        logs: [],
        sessionId: session.id,
        sessionStart: session.start,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save error log data:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });

  describe('addLogEntry', () => {
    it('adds a log entry to storage', () => {
      const entry: LogEntry = {
        id: 'test-1',
        level: 'warn',
        message: 'Warning message',
        timestamp: new Date().toISOString(),
        context: 'TestContext',
      };

      addLogEntry(entry);

      const logs = getLogEntries();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(entry);
    });

    it('accumulates multiple log entries', () => {
      addLogEntry({
        id: 'test-1',
        level: 'info',
        message: 'First message',
        timestamp: new Date().toISOString(),
      });

      addLogEntry({
        id: 'test-2',
        level: 'error',
        message: 'Second message',
        timestamp: new Date().toISOString(),
      });

      const logs = getLogEntries();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('First message');
      expect(logs[1].message).toBe('Second message');
    });
  });

  describe('getLogEntries', () => {
    it('returns empty array when no logs exist', () => {
      const logs = getLogEntries();
      expect(logs).toEqual([]);
    });

    it('returns all stored log entries', () => {
      addLogEntry({
        id: 'test-1',
        level: 'debug',
        message: 'Debug message',
        timestamp: new Date().toISOString(),
      });

      const logs = getLogEntries();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Debug message');
    });
  });

  describe('clearErrorLogs', () => {
    it('removes all error logs from storage', () => {
      addLogEntry({
        id: 'test-1',
        level: 'error',
        message: 'Error to clear',
        timestamp: new Date().toISOString(),
      });

      expect(getLogEntries()).toHaveLength(1);

      clearErrorLogs();

      expect(getLogEntries()).toEqual([]);
    });
  });

  describe('getSessionInfo', () => {
    it('returns consistent session info within same runtime', () => {
      const session1 = getSessionInfo();
      const session2 = getSessionInfo();

      expect(session1.id).toBe(session2.id);
      expect(session1.start).toBe(session2.start);
    });

    it('returns valid session data with expected format', () => {
      const session = getSessionInfo();

      expect(typeof session.id).toBe('string');
      expect(session.id.length).toBeGreaterThan(0);
      // Session ID format: timestamp-randomChars
      expect(session.id).toMatch(/^\d+-[a-z0-9]+$/);
      expect(new Date(session.start).getTime()).not.toBeNaN();
    });
  });
});
