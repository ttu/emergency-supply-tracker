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
    it('generates export data structure with correct types', () => {
      const exportData = generateDebugExport();

      expect(new Date(exportData.exportedAt).getTime()).not.toBeNaN();
      expect(exportData.appVersion).toBe('1.0.0');
      expect(typeof exportData.userAgent).toBe('string');
      expect(exportData.userAgent.length).toBeGreaterThan(0);
      expect(typeof exportData.session.id).toBe('string');
      expect(typeof exportData.session.start).toBe('string');
      expect(Array.isArray(exportData.logs)).toBe(true);
      expect(Array.isArray(exportData.analytics.events)).toBe(true);
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
    it('creates and triggers download with correct blob type and filename', () => {
      const mockClick = vi.fn();
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();

      globalThis.URL.createObjectURL = mockCreateObjectURL;
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

      let capturedLink: HTMLAnchorElement | null = null;
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = mockClick;
          capturedLink = element as HTMLAnchorElement;
        }
        return element;
      });

      downloadDebugExport();

      // Verify blob was created with JSON content type
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe('application/json');

      // Verify link attributes
      expect(capturedLink).not.toBeNull();
      expect(capturedLink!.href).toContain('blob:test');
      expect(capturedLink!.download).toMatch(
        /^emergency-supply-tracker-debug-.*\.json$/,
      );
      // Filename has colons replaced with dashes (dots remain in extension)
      expect(capturedLink!.download).not.toMatch(/:/);

      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');

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
