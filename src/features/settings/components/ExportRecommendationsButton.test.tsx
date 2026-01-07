import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportRecommendationsButton } from './ExportRecommendationsButton';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:test-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock useRecommendedItems hook
const mockExportRecommendedItems = vi.fn();
vi.mock('@/features/templates', () => ({
  useRecommendedItems: () => ({
    exportRecommendedItems: mockExportRecommendedItems,
    customRecommendationsInfo: null,
  }),
}));

describe('ExportRecommendationsButton', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportRecommendedItems.mockReturnValue({
      meta: {
        name: 'Test Kit',
        version: '1.0.0',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      items: [],
    });

    // Mock anchor element click to prevent jsdom navigation errors
    // Access prototype method directly to avoid circular reference
    const originalCreateElement =
      Document.prototype.createElement.bind(document);
    createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          // Mock click to prevent navigation
          element.click = vi.fn();
        }
        return element;
      });
  });

  afterEach(() => {
    // Defensively restore the spy only if it exists and has mockRestore
    if (createElementSpy?.mockRestore) {
      createElementSpy.mockRestore();
    }
  });

  it('should render export button', () => {
    render(<ExportRecommendationsButton />);

    expect(
      screen.getByText('settings.recommendations.export.button'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.recommendations.export.description'),
    ).toBeInTheDocument();
  });

  it('should call exportRecommendedItems on button click', () => {
    render(<ExportRecommendationsButton />);

    const button = screen.getByText('settings.recommendations.export.button');
    fireEvent.click(button);

    expect(mockExportRecommendedItems).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});
