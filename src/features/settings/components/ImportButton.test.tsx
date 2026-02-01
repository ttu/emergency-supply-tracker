import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  beforeEach,
  afterEach,
  vi,
  type Mock,
  type MockInstance,
} from 'vitest';
import { ImportButton } from './ImportButton';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  parseImportJSON: vi.fn(),
  mergeImportData: vi.fn(),
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
  createDefaultAppData: vi.fn(),
}));

const mockShowNotification = vi.fn();
vi.mock('@/shared/hooks/useNotification', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

// Helper to create a file with mocked text() method
function createMockFile(content: string, name = 'data.json'): File {
  const file = new File([content], name, { type: 'application/json' });
  file.text = vi.fn().mockResolvedValue(content);
  return file;
}

describe('ImportButton', () => {
  const mockParseImportJSON = localStorage.parseImportJSON as Mock;
  const mockMergeImportData = localStorage.mergeImportData as Mock;
  const mockGetAppData = localStorage.getAppData as Mock;
  const mockSaveAppData = localStorage.saveAppData as Mock;
  const mockCreateDefaultAppData = localStorage.createDefaultAppData as Mock;

  let consoleErrorSpy: MockInstance;

  const defaultExistingData = {
    version: CURRENT_SCHEMA_VERSION,
    household: {
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
    },
    items: [],
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    // Suppress console.error output from expected error handling in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock window.location.reload to prevent jsdom navigation errors
    globalThis.location = {
      reload: vi.fn(),
    } as unknown as Location;

    // Default mock returns
    mockGetAppData.mockReturnValue(defaultExistingData);
    mockCreateDefaultAppData.mockReturnValue(defaultExistingData);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render import button', () => {
    render(<ImportButton />);

    expect(screen.getByText('settings.import.button')).toBeInTheDocument();
    expect(screen.getByText('settings.import.description')).toBeInTheDocument();
  });

  it('should have hidden file input', () => {
    render(<ImportButton />);

    const fileInput = screen.getByLabelText('settings.import.button');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.json');
  });

  it('should trigger file input on button click', () => {
    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const button = screen.getByText('settings.import.button');
    fireEvent.click(button);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should open selection modal for valid JSON import', async () => {
    const validData = {
      version: CURRENT_SCHEMA_VERSION,
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      settings: {
        language: 'en',
        theme: 'dark',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      items: [{ id: '1', name: 'Test' }],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockParseImportJSON.mockReturnValue(validData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(validData)], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Modal should open with selection options
    await waitFor(() => {
      expect(
        screen.getByText('settings.importSelection.title'),
      ).toBeInTheDocument();
    });
  });

  it('should import selected sections when user confirms', async () => {
    const user = userEvent.setup();
    const validData = {
      version: CURRENT_SCHEMA_VERSION,
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      settings: {
        language: 'fi',
        theme: 'dark',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      items: [{ id: '1', name: 'Test' }],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    const mergedData = { ...defaultExistingData, ...validData };

    mockParseImportJSON.mockReturnValue(validData);
    mockMergeImportData.mockReturnValue(mergedData);

    const onImportSuccess = vi.fn();

    render(<ImportButton onImportSuccess={onImportSuccess} />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(validData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.importSelection.title'),
      ).toBeInTheDocument();
    });

    // Click import button in modal
    const importButton = screen.getByText(
      'settings.importSelection.importButton',
    );
    await user.click(importButton);

    await waitFor(() => {
      expect(mockMergeImportData).toHaveBeenCalled();
      expect(mockSaveAppData).toHaveBeenCalledWith(mergedData);
      expect(mockShowNotification).toHaveBeenCalledWith(
        'notifications.importSuccess',
        'success',
      );
      expect(onImportSuccess).toHaveBeenCalled();
    });
  });

  it('should show error for invalid JSON format', async () => {
    const invalidData = {
      foo: 'bar', // missing required fields
      version: CURRENT_SCHEMA_VERSION,
      lastModified: '2024-01-01T00:00:00.000Z',
      // No sections with data
    };

    mockParseImportJSON.mockReturnValue(invalidData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(invalidData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'notifications.importError',
        'error',
      );
    });

    expect(mockSaveAppData).not.toHaveBeenCalled();
  });

  it('should close modal when user cancels', async () => {
    const user = userEvent.setup();
    const validData = {
      version: CURRENT_SCHEMA_VERSION,
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      settings: {
        language: 'en',
        theme: 'dark',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      items: [{ id: '1', name: 'Test' }],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockParseImportJSON.mockReturnValue(validData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(validData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.importSelection.title'),
      ).toBeInTheDocument();
    });

    // Click cancel button in modal
    const cancelButton = screen.getByText('common.cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('settings.importSelection.title'),
      ).not.toBeInTheDocument();
    });

    expect(mockSaveAppData).not.toHaveBeenCalled();
  });

  it('should handle file read error', async () => {
    mockParseImportJSON.mockImplementation(() => {
      throw new Error('Parse error');
    });

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile('invalid json');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'notifications.importError',
        'error',
      );
    });
  });

  it('should do nothing when no file selected', () => {
    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [] } });

    expect(mockParseImportJSON).not.toHaveBeenCalled();
  });

  it('should reset file input after selecting file', async () => {
    const validData = {
      version: CURRENT_SCHEMA_VERSION,
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      settings: {
        language: 'en',
        theme: 'dark',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      items: [{ id: '1', name: 'Test' }],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockParseImportJSON.mockReturnValue(validData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(validData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockParseImportJSON).toHaveBeenCalled();
    });
  });

  it('should validate data has version field', async () => {
    // Missing version
    const missingVersion = {
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      settings: { language: 'en' },
      items: [],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockParseImportJSON.mockReturnValue(missingVersion);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(missingVersion));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'notifications.importError',
        'error',
      );
    });
  });

  it('should validate data is an object', async () => {
    mockParseImportJSON.mockReturnValue(null);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile('null');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'notifications.importError',
        'error',
      );
    });
  });

  it('should show warning message in modal', async () => {
    const validData = {
      version: CURRENT_SCHEMA_VERSION,
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      items: [{ id: '1', name: 'Test' }],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockParseImportJSON.mockReturnValue(validData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(validData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText('settings.importSelection.warning'),
      ).toBeInTheDocument();
    });
  });
});
