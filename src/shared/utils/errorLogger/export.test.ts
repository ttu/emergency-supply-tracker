import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest';
import {
  generateDebugExport,
  downloadDebugExport,
  clearErrorLogs,
  getLogCount,
} from './export';
import { info, error } from './logger';

describe('errorLogger export', () => {
  let consoleInfoSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    localStorage.clear();
    // Suppress console output from logger functions during tests
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('generateDebugExport', () => {
    it('generates export data structure', () => {
      const exportData = generateDebugExport();

      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.appVersion).toBe('1.0.0');
      expect(exportData.userAgent).toBeDefined();
      expect(exportData.session).toBeDefined();
      expect(exportData.session.id).toBeDefined();
      expect(exportData.session.start).toBeDefined();
      expect(exportData.logs).toBeDefined();
      expect(exportData.analytics).toBeDefined();
      expect(exportData.analytics.events).toBeDefined();
      expect(exportData.analytics.stats).toBeDefined();
    });

    it('includes logged entries', () => {
      info('Test info');
      error('Test error');

      const exportData = generateDebugExport();

      expect(exportData.logs).toHaveLength(2);
      expect(exportData.logs[0].message).toBe('Test info');
      expect(exportData.logs[1].message).toBe('Test error');
    });

    it('includes valid timestamp', () => {
      const exportData = generateDebugExport();
      const timestamp = new Date(exportData.exportedAt);

      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('downloadDebugExport', () => {
    it('creates and triggers download', () => {
      const mockClick = vi.fn();
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();

      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

      // Create a real anchor element but mock its click
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = mockClick;
        }
        return element;
      });

      downloadDebugExport();

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('clearErrorLogs', () => {
    it('clears all error logs', () => {
      info('Test log');
      expect(getLogCount()).toBe(1);

      clearErrorLogs();

      expect(getLogCount()).toBe(0);
    });
  });

  describe('getLogCount', () => {
    it('returns 0 when no logs exist', () => {
      expect(getLogCount()).toBe(0);
    });

    it('returns correct count after logging', () => {
      info('Log 1');
      info('Log 2');
      error('Log 3');

      expect(getLogCount()).toBe(3);
    });
  });
});
