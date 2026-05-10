/**
 * Mutation-killing tests for export.ts
 *
 * Targets surviving mutants:
 * - L53 ArrayDeclaration: [] instead of [json] in Blob constructor
 * - L56 StringLiteral: "" instead of filename template
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadDebugExport, generateDebugExport } from './export';

describe('export.ts mutation killers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('L53 ArrayDeclaration [] + L56 StringLiteral "" in downloadDebugExport', () => {
    it('creates a Blob with non-empty content and sets a non-empty filename', () => {
      // Mock DOM methods
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockRevokeObjectURL = vi.fn();
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');

      const createdLink: Record<string, unknown> = {};
      vi.spyOn(document, 'createElement').mockReturnValue({
        set href(v: string) {
          createdLink.href = v;
        },
        get href() {
          return createdLink.href as string;
        },
        set download(v: string) {
          createdLink.download = v;
        },
        get download() {
          return createdLink.download as string;
        },
        click: mockClick,
      } as unknown as HTMLAnchorElement);

      vi.spyOn(document.body, 'appendChild').mockImplementation(
        mockAppendChild,
      );
      vi.spyOn(document.body, 'removeChild').mockImplementation(
        mockRemoveChild,
      );
      vi.spyOn(URL, 'createObjectURL').mockImplementation(mockCreateObjectURL);
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);

      downloadDebugExport();

      // L53: Blob should be created with actual content, not empty array
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.size).toBeGreaterThan(0); // Kills [] mutant: empty Blob has size 0

      // L56: filename should not be empty
      expect(createdLink.download).toBeTruthy();
      expect(typeof createdLink.download).toBe('string');
      expect((createdLink.download as string).length).toBeGreaterThan(0); // Kills "" mutant
      expect(createdLink.download).toContain('emergency-supply-tracker-debug-');

      // Verify click and cleanup happened
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('generateDebugExport returns valid structure', () => {
    it('returns non-empty logs array structure', () => {
      const result = generateDebugExport();
      expect(result).toHaveProperty('exportedAt');
      expect(result).toHaveProperty('logs');
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result).toHaveProperty('analytics');
      expect(result.analytics).toHaveProperty('events');
    });
  });
});
