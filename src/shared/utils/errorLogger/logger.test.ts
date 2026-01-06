import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  debug,
  info,
  warn,
  error,
  logErrorBoundary,
  getLogs,
  getSession,
} from './logger';
import { clearErrorLogs } from './storage';

describe('errorLogger logger', () => {
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

  describe('debug', () => {
    it('logs a debug message', () => {
      debug('Debug message');

      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Debug message');
    });

    it('logs with context', () => {
      debug('Debug with context', { context: 'TestContext' });

      const logs = getLogs();
      expect(logs[0].context).toBe('TestContext');
    });

    it('logs with metadata', () => {
      debug('Debug with metadata', {
        metadata: { key: 'value', count: 42 },
      });

      const logs = getLogs();
      expect(logs[0].metadata).toEqual({ key: 'value', count: 42 });
    });
  });

  describe('info', () => {
    it('logs an info message', () => {
      info('Info message');

      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Info message');
    });
  });

  describe('warn', () => {
    it('logs a warning message', () => {
      warn('Warning message');

      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Warning message');
    });

    it('logs with error object', () => {
      const testError = new Error('Test error');
      warn('Warning with error', { error: testError });

      const logs = getLogs();
      expect(logs[0].error).toBeDefined();
      expect(logs[0].error?.name).toBe('Error');
      expect(logs[0].error?.message).toBe('Test error');
    });
  });

  describe('error', () => {
    it('logs an error message', () => {
      error('Error message');

      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Error message');
    });

    it('extracts error details from Error object', () => {
      const testError = new Error('Test error message');
      error('Something failed', { error: testError });

      const logs = getLogs();
      expect(logs[0].error).toBeDefined();
      expect(logs[0].error?.name).toBe('Error');
      expect(logs[0].error?.message).toBe('Test error message');
      expect(logs[0].error?.stack).toBeDefined();
    });

    it('handles non-Error values', () => {
      error('Something failed', { error: 'string error' });

      const logs = getLogs();
      expect(logs[0].error?.name).toBe('UnknownError');
      expect(logs[0].error?.message).toBe('string error');
    });
  });

  describe('logErrorBoundary', () => {
    it('logs error boundary errors', () => {
      const testError = new Error('Component crashed');
      logErrorBoundary(testError, {
        componentStack: '\n    at Button\n    at App',
      });

      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].context).toBe('ErrorBoundary');
      expect(logs[0].error?.message).toBe('Component crashed');
      expect(logs[0].metadata?.componentStack).toBeDefined();
    });
  });

  describe('getLogs', () => {
    it('returns all logged entries', () => {
      debug('Debug');
      info('Info');
      warn('Warn');
      error('Error');

      const logs = getLogs();
      expect(logs).toHaveLength(4);

      const levels = logs.map((l) => l.level);
      expect(levels).toEqual(['debug', 'info', 'warn', 'error']);
    });
  });

  describe('getSession', () => {
    it('returns session info', () => {
      const session = getSession();

      expect(session.id).toBeDefined();
      expect(session.start).toBeDefined();
    });
  });

  describe('log entry structure', () => {
    it('includes required fields', () => {
      info('Test message');

      const logs = getLogs();
      const log = logs[0];

      expect(log.id).toBeDefined();
      expect(log.level).toBeDefined();
      expect(log.message).toBeDefined();
      expect(log.timestamp).toBeDefined();
    });

    it('generates unique IDs', () => {
      info('First');
      info('Second');

      const logs = getLogs();
      expect(logs[0].id).not.toBe(logs[1].id);
    });

    it('includes valid timestamp', () => {
      info('Test');

      const logs = getLogs();
      const timestamp = new Date(logs[0].timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});
