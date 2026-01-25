import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { DataErrorPage } from './DataErrorPage';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { STORAGE_KEY } from '@/shared/utils/storage/localStorage';

// Override the global i18next mock with real implementation for this test
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return actual;
});

// Mock localStorage functions
vi.mock('@/shared/utils/storage/localStorage', async () => {
  const actual = await vi.importActual('@/shared/utils/storage/localStorage');
  return {
    ...actual,
    getLastDataValidationResult: vi.fn(),
    clearAppData: vi.fn(),
    clearDataValidationResult: vi.fn(),
  };
});

// Mock the utility modules
vi.mock('@/shared/utils/errorLogger/storage', () => ({
  clearErrorLogs: vi.fn(),
}));

vi.mock('@/shared/utils/analytics/storage', () => ({
  clearAnalyticsData: vi.fn(),
}));

vi.mock('@/shared/utils/download', () => ({
  downloadFile: vi.fn(),
  generateDateFilename: vi.fn((prefix: string) => `${prefix}-2024-01-01.json`),
}));

// Initialize i18n for tests
i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      common: {
        dataError: {
          title: 'Data Error',
          message: 'Your saved data could not be loaded due to invalid values.',
          details: 'Error Details',
          unknownError: 'Unknown validation error',
          dataManagementDescription:
            'You can download your corrupted data for backup, or delete it to start fresh.',
        },
        errorBoundary: {
          reload: 'Reload Page',
          dataManagement: {
            title: 'Data Management',
            downloadData: 'Download Data',
            deleteData: 'Delete All Data',
            confirmDelete: 'Are you sure you want to delete all your data?',
            confirmDeleteAgain: 'Last chance! All data will be deleted.',
            deleteSuccess: 'All data has been cleared.',
          },
        },
        settings: {
          export: {
            noData: 'No data to export',
          },
        },
      },
    },
  },
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

// Helper to wrap components with i18n provider
function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('DataErrorPage', () => {
  const mockValidationResult = {
    isValid: false,
    errors: [
      {
        field: 'settings.theme',
        message: 'Invalid theme: "invalid". Must be one of: ocean, forest',
        value: 'invalid',
      },
      {
        field: 'household.adults',
        message: 'adults must be a non-negative number',
        value: -1,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage.clear();
    vi.mocked(localStorage.getLastDataValidationResult).mockReturnValue(
      mockValidationResult,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the error page with title and message', () => {
    renderWithI18n(<DataErrorPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Data Error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your saved data could not be loaded due to invalid values.',
      ),
    ).toBeInTheDocument();
  });

  it('renders error details summary', () => {
    renderWithI18n(<DataErrorPage />);

    expect(screen.getByText('Error Details')).toBeInTheDocument();
    // Check for the formatted error messages
    expect(
      screen.getByText(/settings\.theme: Invalid theme/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/household\.adults: adults must be a non-negative/),
    ).toBeInTheDocument();
  });

  it('renders reload button', () => {
    renderWithI18n(<DataErrorPage />);

    expect(
      screen.getByRole('button', { name: 'Reload Page' }),
    ).toBeInTheDocument();
  });

  it('renders data management section with download and delete buttons', () => {
    renderWithI18n(<DataErrorPage />);

    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download Data' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete All Data' }),
    ).toBeInTheDocument();
  });

  it('reloads page when reload button is clicked', async () => {
    const user = userEvent.setup();
    const reloadSpy = vi.fn();
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    try {
      renderWithI18n(<DataErrorPage />);
      await user.click(screen.getByRole('button', { name: 'Reload Page' }));
      expect(reloadSpy).toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'location', {
        value: originalLocation,
        writable: true,
      });
    }
  });

  it('shows alert when trying to download with no data', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    globalThis.localStorage.removeItem(STORAGE_KEY);

    renderWithI18n(<DataErrorPage />);
    await user.click(screen.getByRole('button', { name: 'Download Data' }));

    expect(alertSpy).toHaveBeenCalledWith('No data to export');
    alertSpy.mockRestore();
  });

  it('downloads data when data exists in localStorage', async () => {
    const user = userEvent.setup();
    const testData = { version: '1.0', items: [] };
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));

    const { downloadFile } = await import('@/shared/utils/download');

    renderWithI18n(<DataErrorPage />);
    await user.click(screen.getByRole('button', { name: 'Download Data' }));

    expect(downloadFile).toHaveBeenCalled();
  });

  it('deletes data after double confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    const reloadSpy = vi.fn();
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    try {
      renderWithI18n(<DataErrorPage />);
      await user.click(screen.getByRole('button', { name: 'Delete All Data' }));

      expect(confirmSpy).toHaveBeenCalledTimes(2);
      expect(alertSpy).toHaveBeenCalledWith('All data has been cleared.');
      expect(localStorage.clearAppData).toHaveBeenCalled();
      expect(localStorage.clearDataValidationResult).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'location', {
        value: originalLocation,
        writable: true,
      });
      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    }
  });

  it('calls onRetry instead of reload when provided', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    const onRetry = vi.fn();

    renderWithI18n(<DataErrorPage onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: 'Delete All Data' }));

    expect(onRetry).toHaveBeenCalled();

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('does not delete data if first confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValueOnce(false);
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});

    renderWithI18n(<DataErrorPage />);
    await user.click(screen.getByRole('button', { name: 'Delete All Data' }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(localStorage.clearAppData).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('does not delete data if second confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});

    renderWithI18n(<DataErrorPage />);
    await user.click(screen.getByRole('button', { name: 'Delete All Data' }));

    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(localStorage.clearAppData).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('shows unknown error message when no validation result', () => {
    vi.mocked(localStorage.getLastDataValidationResult).mockReturnValue(null);

    renderWithI18n(<DataErrorPage />);

    expect(screen.getByText('Unknown validation error')).toBeInTheDocument();
  });

  it('shows unknown error message when validation result has empty errors array', () => {
    vi.mocked(localStorage.getLastDataValidationResult).mockReturnValue({
      isValid: false,
      errors: [],
    });

    renderWithI18n(<DataErrorPage />);

    expect(screen.getByText('Unknown validation error')).toBeInTheDocument();
  });

  it('downloads raw JSON when data parsing fails', async () => {
    const user = userEvent.setup();
    globalThis.localStorage.setItem(STORAGE_KEY, 'invalid json {{{');

    const { downloadFile } = await import('@/shared/utils/download');

    renderWithI18n(<DataErrorPage />);
    await user.click(screen.getByRole('button', { name: 'Download Data' }));

    expect(downloadFile).toHaveBeenCalledWith(
      'invalid json {{{',
      'emergency-supplies-raw-2024-01-01.json',
    );
  });
});
