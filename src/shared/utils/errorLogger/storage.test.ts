import { describe, it, expect, beforeEach } from 'vitest';
import {
  getErrorLogData,
  saveErrorLogData,
  addLogEntry,
  getLogEntries,
  clearErrorLogs,
  getSessionInfo,
  ERROR_LOG_STORAGE_KEY,
} from './storage';
import type { LogEntry } from './types';

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
    });

    it('trims logs when exceeding max entries', () => {
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
      expect(data.logs.length).toBeLessThanOrEqual(500);
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

    it('returns valid session data', () => {
      const session = getSessionInfo();

      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
      expect(session.start).toBeDefined();
      expect(new Date(session.start).getTime()).not.toBeNaN();
    });
  });
});
