import { render, screen, fireEvent } from '@testing-library/react';
import { ExportRecommendationsButton } from './ExportRecommendationsButton';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:test-url');
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock useRecommendedItems hook
const mockExportRecommendedItems = jest.fn();
jest.mock('@/shared/hooks/useRecommendedItems', () => ({
  useRecommendedItems: () => ({
    exportRecommendedItems: mockExportRecommendedItems,
    customRecommendationsInfo: null,
  }),
}));

describe('ExportRecommendationsButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExportRecommendedItems.mockReturnValue({
      meta: {
        name: 'Test Kit',
        version: '1.0.0',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      items: [],
    });
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
