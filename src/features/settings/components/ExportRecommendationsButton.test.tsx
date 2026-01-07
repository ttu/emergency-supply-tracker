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
    // Directly mock HTMLAnchorElement.prototype.click instead of intercepting createElement
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn());
  });

  afterEach(() => {
    // Restore all mocks to prevent test state leakage
    vi.restoreAllMocks();
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
