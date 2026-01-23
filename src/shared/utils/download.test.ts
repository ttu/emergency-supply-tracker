import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadFile,
  generateDateFilename,
  generateTimestampFilename,
} from './download';

describe('download utilities', () => {
  describe('downloadFile', () => {
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let appendChildSpy: ReturnType<typeof vi.spyOn>;
    let clickSpy: ReturnType<typeof vi.fn>;
    let removeSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createObjectURLSpy = vi
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob:test-url');
      revokeObjectURLSpy = vi
        .spyOn(URL, 'revokeObjectURL')
        .mockImplementation(() => {});
      appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation((node) => node);
      clickSpy = vi.fn();
      removeSpy = vi.fn();

      vi.spyOn(document, 'createElement').mockImplementation(() => {
        const element = {
          href: '',
          download: '',
          click: clickSpy,
          remove: removeSpy,
        } as unknown as HTMLAnchorElement;
        return element;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('downloads string content as a file', () => {
      const content = '{"test": "data"}';
      const filename = 'test-file.json';

      downloadFile(content, filename);

      expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
    });

    it('downloads Blob content directly', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test-file.txt';

      downloadFile(blob, filename);

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });

    it('uses custom MIME type when provided', () => {
      const content = 'test,csv,data';
      const filename = 'test-file.csv';

      downloadFile(content, filename, 'text/csv');

      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('text/csv');
    });

    it('uses default application/json MIME type', () => {
      const content = '{"test": "data"}';
      const filename = 'test-file.json';

      downloadFile(content, filename);

      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('application/json');
    });
  });

  describe('generateDateFilename', () => {
    it('generates filename with current date', () => {
      const mockDate = new Date('2024-06-15T10:30:00.000Z');
      vi.setSystemTime(mockDate);

      const filename = generateDateFilename('emergency-supplies');

      expect(filename).toBe('emergency-supplies-2024-06-15.json');

      vi.useRealTimers();
    });

    it('uses custom extension when provided', () => {
      const mockDate = new Date('2024-06-15T10:30:00.000Z');
      vi.setSystemTime(mockDate);

      const filename = generateDateFilename('backup', 'txt');

      expect(filename).toBe('backup-2024-06-15.txt');

      vi.useRealTimers();
    });

    it('uses json as default extension', () => {
      const filename = generateDateFilename('test');
      expect(filename).toMatch(/^test-\d{4}-\d{2}-\d{2}\.json$/);
    });
  });

  describe('generateTimestampFilename', () => {
    it('generates filename with full timestamp', () => {
      const mockDate = new Date('2024-06-15T10:30:45.123Z');
      vi.setSystemTime(mockDate);

      const filename = generateTimestampFilename('debug-export');

      expect(filename).toBe('debug-export-2024-06-15T10-30-45-123Z.json');

      vi.useRealTimers();
    });

    it('uses custom extension when provided', () => {
      const mockDate = new Date('2024-06-15T10:30:45.123Z');
      vi.setSystemTime(mockDate);

      const filename = generateTimestampFilename('log', 'txt');

      expect(filename).toBe('log-2024-06-15T10-30-45-123Z.txt');

      vi.useRealTimers();
    });

    it('replaces colons and dots with hyphens', () => {
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      vi.setSystemTime(mockDate);

      const filename = generateTimestampFilename('test');

      // Should not contain : or .  (except for file extension)
      const timestampPart = filename.replace('.json', '').replace('test-', '');
      expect(timestampPart).not.toContain(':');
      expect(timestampPart).not.toContain('.');

      vi.useRealTimers();
    });
  });
});
