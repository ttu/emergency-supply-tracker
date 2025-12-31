import { render, screen, fireEvent } from '@testing-library/react';
import { RecommendationsStatus } from './RecommendationsStatus';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options) {
        return `${key} ${JSON.stringify(options)}`;
      }
      return key;
    },
  }),
}));

// Mock useRecommendedItems hook
const mockResetToDefaultRecommendations = jest.fn();
const mockUseRecommendedItems = jest.fn();
jest.mock('../../hooks/useRecommendedItems', () => ({
  useRecommendedItems: () => mockUseRecommendedItems(),
}));

describe('RecommendationsStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm = jest.fn(() => true);
  });

  it('should show default status when using built-in recommendations', () => {
    mockUseRecommendedItems.mockReturnValue({
      recommendedItems: new Array(70).fill({}),
      customRecommendationsInfo: null,
      isUsingCustomRecommendations: false,
      resetToDefaultRecommendations: mockResetToDefaultRecommendations,
    });

    render(<RecommendationsStatus />);

    expect(
      screen.getByText('settings.recommendations.status.label'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/settings.recommendations.status.default.*"count":70/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('settings.recommendations.reset.button'),
    ).not.toBeInTheDocument();
  });

  it('should show custom status when using imported recommendations', () => {
    mockUseRecommendedItems.mockReturnValue({
      recommendedItems: new Array(25).fill({}),
      customRecommendationsInfo: {
        name: 'My Custom Kit',
        version: '1.0.0',
        itemCount: 25,
      },
      isUsingCustomRecommendations: true,
      resetToDefaultRecommendations: mockResetToDefaultRecommendations,
    });

    render(<RecommendationsStatus />);

    expect(
      screen.getByText(
        /settings.recommendations.status.custom.*"name":"My Custom Kit".*"count":25/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.recommendations.reset.button'),
    ).toBeInTheDocument();
  });

  it('should call resetToDefaultRecommendations when reset button is clicked and confirmed', () => {
    mockUseRecommendedItems.mockReturnValue({
      recommendedItems: new Array(25).fill({}),
      customRecommendationsInfo: {
        name: 'My Custom Kit',
        version: '1.0.0',
        itemCount: 25,
      },
      isUsingCustomRecommendations: true,
      resetToDefaultRecommendations: mockResetToDefaultRecommendations,
    });

    render(<RecommendationsStatus />);

    const resetButton = screen.getByText(
      'settings.recommendations.reset.button',
    );
    fireEvent.click(resetButton);

    expect(global.confirm).toHaveBeenCalledWith(
      'settings.recommendations.reset.confirm',
    );
    expect(mockResetToDefaultRecommendations).toHaveBeenCalled();
  });

  it('should not call resetToDefaultRecommendations when reset is cancelled', () => {
    global.confirm = jest.fn(() => false);

    mockUseRecommendedItems.mockReturnValue({
      recommendedItems: new Array(25).fill({}),
      customRecommendationsInfo: {
        name: 'My Custom Kit',
        version: '1.0.0',
        itemCount: 25,
      },
      isUsingCustomRecommendations: true,
      resetToDefaultRecommendations: mockResetToDefaultRecommendations,
    });

    render(<RecommendationsStatus />);

    const resetButton = screen.getByText(
      'settings.recommendations.reset.button',
    );
    fireEvent.click(resetButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockResetToDefaultRecommendations).not.toHaveBeenCalled();
  });
});
