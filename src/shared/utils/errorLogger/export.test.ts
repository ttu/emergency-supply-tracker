import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  generateDebugExport,
  downloadDebugExport,
  clearErrorLogs,
  getLogCount,
} from './export';
import { info, error } from './logger';

describe('errorLogger export', () => {
  beforeEach(() => {
    localStorage.clear();
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
      const mockClick = jest.fn();
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = jest.fn();

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Create a real anchor element but mock its click
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
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

      jest.restoreAllMocks();
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
