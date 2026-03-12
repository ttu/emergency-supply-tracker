/**
 * Mutation-killing tests for download.ts
 *
 * Target: ArrayDeclaration L19 [] — new Blob([content], ...)
 * If mutated to new Blob([], ...), the blob would be empty instead of containing content.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile } from './download';

describe('downloadFile mutation tests — Blob content array', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      return {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      } as unknown as HTMLAnchorElement;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a Blob with non-zero size when string content is provided', () => {
    const content = '{"data":"test"}';
    downloadFile(content, 'test.json');

    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    // If [content] is mutated to [], the blob size would be 0
    expect(blobArg.size).toBeGreaterThan(0);
    expect(blobArg.size).toBe(content.length);
  });
});
