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

    it('returns undefined error details when error is undefined', () => {
      error('Something failed', { error: undefined });

      const logs = getLogs();
      expect(logs[0].error).toBeUndefined();
    });

    it('handles numeric error values', () => {
      error('Something failed', { error: 42 });

      const logs = getLogs();
      expect(logs[0].error?.name).toBe('UnknownError');
      expect(logs[0].error?.message).toBe('42');
    });

    it('handles null error values', () => {
      error('Something failed', { error: null });

      const logs = getLogs();
      expect(logs[0].error?.name).toBe('UnknownError');
      expect(logs[0].error?.message).toBe('null');
    });
  });

  describe('logErrorBoundary', () => {
    it('logs error boundary errors with correct message and context', () => {
      const testError = new Error('Component crashed');
      logErrorBoundary(testError, {
        componentStack: '\n    at Button\n    at App',
      });

      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('React Error Boundary caught an error');
      expect(logs[0].context).toBe('ErrorBoundary');
      expect(logs[0].error?.message).toBe('Component crashed');
      expect(logs[0].metadata?.componentStack).toBe(
        '\n    at Button\n    at App',
      );
    });
  });

  describe('console output', () => {
    it('debug logs to console.log (not console.debug)', () => {
      debug('Debug console test');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        // no error arg
      );
      expect(console.log).toHaveBeenCalledWith('[DEBUG] Debug console test');
    });

    it('info logs to console.info', () => {
      info('Info console test');

      expect(console.info).toHaveBeenCalledWith('[INFO] Info console test');
    });

    it('warn logs to console.warn', () => {
      warn('Warn console test');

      expect(console.warn).toHaveBeenCalledWith('[WARN] Warn console test');
    });

    it('error logs to console.error', () => {
      error('Error console test');

      expect(console.error).toHaveBeenCalledWith('[ERROR] Error console test');
    });

    it('includes context in console prefix', () => {
      info('Context test', { context: 'MyComponent' });

      expect(console.info).toHaveBeenCalledWith(
        '[INFO] [MyComponent] Context test',
      );
    });

    it('omits context bracket when no context provided', () => {
      info('No context test');

      expect(console.info).toHaveBeenCalledWith('[INFO] No context test');
    });

    it('passes error object as second arg to console when error option provided', () => {
      const testError = new Error('test');
      error('Failed', { error: testError });

      expect(console.error).toHaveBeenCalledWith('[ERROR] Failed', testError);
    });

    it('does not pass error arg to console when no error option', () => {
      error('No error arg');

      expect(console.error).toHaveBeenCalledWith('[ERROR] No error arg');
      // Should be called with exactly 1 argument
      expect(console.error).toHaveBeenCalledTimes(1);
      const callArgs = (console.error as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs).toHaveLength(1);
    });

    it('includes context in prefix when error is also present', () => {
      const testError = new Error('test');
      warn('With context and error', {
        context: 'TestCtx',
        error: testError,
      });

      expect(console.warn).toHaveBeenCalledWith(
        '[WARN] [TestCtx] With context and error',
        testError,
      );
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
    it('returns session info with valid format', () => {
      const session = getSession();

      expect(typeof session.id).toBe('string');
      expect(session.id.length).toBeGreaterThan(0);
      expect(typeof session.start).toBe('string');
      expect(new Date(session.start).getTime()).not.toBeNaN();
    });
  });

  describe('log entry structure', () => {
    it('includes required fields with correct types', () => {
      info('Test message');

      const logs = getLogs();
      const log = logs[0];

      expect(typeof log.id).toBe('string');
      expect(log.id.length).toBeGreaterThan(0);
      expect(log.level).toBe('info');
      expect(log.message).toBe('Test message');
      expect(new Date(log.timestamp).getTime()).not.toBeNaN();
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

    it('includes optional fields when provided', () => {
      info('With options', {
        context: 'TestCtx',
        metadata: { key: 'val' },
      });

      const logs = getLogs();
      expect(logs[0].context).toBe('TestCtx');
      expect(logs[0].metadata).toEqual({ key: 'val' });
    });

    it('omits optional fields when not provided', () => {
      info('No options');

      const logs = getLogs();
      expect(logs[0].context).toBeUndefined();
      expect(logs[0].error).toBeUndefined();
      expect(logs[0].metadata).toBeUndefined();
    });
  });

  describe('storage failure handling', () => {
    it('catches addLogEntry errors and logs to console.error with entry details', async () => {
      const storageModule = await import('./storage');
      const addLogEntrySpy = vi
        .spyOn(storageModule, 'addLogEntry')
        .mockImplementation(() => {
          throw new Error('Storage corrupted');
        });

      // Should not throw — error is caught internally by log()
      info('Will fail to store', { context: 'TestCtx' });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorLogger] Failed to persist log entry'),
        expect.any(Error),
      );
      // The error message includes entry id and context
      const errorCall = (
        console.error as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('[ErrorLogger]'),
      );
      expect(errorCall).toBeDefined();
      expect(errorCall![0]).toContain('context: TestCtx');

      addLogEntrySpy.mockRestore();
    });

    it('logs context as "none" when no context provided and storage fails', async () => {
      const storageModule = await import('./storage');
      const addLogEntrySpy = vi
        .spyOn(storageModule, 'addLogEntry')
        .mockImplementation(() => {
          throw new Error('Storage corrupted');
        });

      info('No context fail');

      const errorCall = (
        console.error as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('[ErrorLogger]'),
      );
      expect(errorCall).toBeDefined();
      expect(errorCall![0]).toContain('context: none');

      addLogEntrySpy.mockRestore();
    });
  });
});
