import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, jest } from '@jest/globals';
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
jest.mock('@/features/templates', () => ({
  useRecommendedItems: () => mockUseRecommendedItems(),
}));

describe('RecommendationsStatus', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error output from expected error handling in tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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
      screen.queryByTestId('reset-recommendations-button'),
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
      screen.getByTestId('reset-recommendations-button'),
    ).toBeInTheDocument();
  });

  it('should show confirmation dialog when reset button is clicked', async () => {
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

    const resetButton = screen.getByTestId('reset-recommendations-button');
    fireEvent.click(resetButton);

    // Dialog should now be open
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    expect(
      screen.getByText('settings.recommendations.reset.confirm'),
    ).toBeInTheDocument();
  });

  it('should call resetToDefaultRecommendations when reset is confirmed', async () => {
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

    // Click reset button to open dialog
    const resetButton = screen.getByTestId('reset-recommendations-button');
    fireEvent.click(resetButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Click confirm button in dialog (danger variant button with confirmLabel)
    // The confirm button is the one inside the dialog (not the original reset button)
    const dialogButtons = screen.getAllByRole('button', {
      name: 'settings.recommendations.reset.button',
    });
    // Click the last one (the one in the dialog)
    fireEvent.click(dialogButtons[dialogButtons.length - 1]);

    await waitFor(() => {
      expect(mockResetToDefaultRecommendations).toHaveBeenCalled();
    });
  });

  it('should not call resetToDefaultRecommendations when reset is cancelled', async () => {
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

    // Click reset button to open dialog
    const resetButton = screen.getByTestId('reset-recommendations-button');
    fireEvent.click(resetButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: 'buttons.cancel' });
    fireEvent.click(cancelButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(mockResetToDefaultRecommendations).not.toHaveBeenCalled();
  });

  it('should close dialog when Escape key is pressed', async () => {
    const user = userEvent.setup();
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

    // Click reset button to open dialog
    const resetButton = screen.getByTestId('reset-recommendations-button');
    fireEvent.click(resetButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Press Escape key
    await user.keyboard('{Escape}');

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(mockResetToDefaultRecommendations).not.toHaveBeenCalled();
  });

  it('should show success toast after successful reset', async () => {
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

    // Click reset button to open dialog
    const resetButton = screen.getByTestId('reset-recommendations-button');
    fireEvent.click(resetButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Click confirm button
    const dialogButtons = screen.getAllByRole('button', {
      name: 'settings.recommendations.reset.button',
    });
    fireEvent.click(dialogButtons[dialogButtons.length - 1]);

    // Success toast should appear
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  it('should show error toast when reset fails', async () => {
    mockResetToDefaultRecommendations.mockImplementation(() => {
      throw new Error('Reset failed');
    });

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

    // Click reset button to open dialog
    const resetButton = screen.getByTestId('reset-recommendations-button');
    fireEvent.click(resetButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Click confirm button
    const dialogButtons = screen.getAllByRole('button', {
      name: 'settings.recommendations.reset.button',
    });
    fireEvent.click(dialogButtons[dialogButtons.length - 1]);

    // Error toast should appear with the error message
    await waitFor(() => {
      expect(screen.getByText('Reset failed')).toBeInTheDocument();
    });
  });
});
