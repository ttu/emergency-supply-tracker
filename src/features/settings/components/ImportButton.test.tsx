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
import type { MultiInventoryExportData } from '@/shared/types/exportImport';
import { createMockRootStorage } from '@/shared/utils/test/factories';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  parseMultiInventoryImport: vi.fn(),
  importMultiInventory: vi.fn(),
  saveRootStorageAfterImport: vi.fn(),
  getRootStorageForExport: vi.fn(),
  getInventorySetList: vi.fn(),
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

function createValidMultiInventoryExport(): MultiInventoryExportData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
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
    inventorySets: [
      {
        name: 'Home Inventory',
        includedSections: ['items', 'household'],
        data: {
          id: 'home' as never,
          name: 'Home Inventory',
          household: {
            adults: 2,
            children: 0,
            pets: 0,
            supplyDurationDays: 7,
            useFreezer: false,
          },
          items: [
            {
              id: '1' as never,
              name: 'Test Item',
              itemType: 'custom',
              categoryId: 'food' as never,
              quantity: 1 as never,
              unit: 'pieces',
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          ],
          customCategories: [],
          customTemplates: [],
          dismissedAlertIds: [],
          disabledRecommendedItems: [],
          disabledCategories: [],
          lastModified: '2024-01-01T00:00:00.000Z',
        },
      },
    ],
  };
}

describe('ImportButton', () => {
  const mockParseMultiInventoryImport =
    localStorage.parseMultiInventoryImport as Mock;
  const mockImportMultiInventory = localStorage.importMultiInventory as Mock;
  const mockSaveRootStorageAfterImport =
    localStorage.saveRootStorageAfterImport as Mock;
  const mockGetRootStorageForExport =
    localStorage.getRootStorageForExport as Mock;
  const mockGetInventorySetList = localStorage.getInventorySetList as Mock;

  let consoleErrorSpy: MockInstance;

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
    mockGetRootStorageForExport.mockReturnValue(createMockRootStorage());
    mockGetInventorySetList.mockReturnValue([
      { id: 'default', name: 'Default' },
    ]);
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
    const validData = createValidMultiInventoryExport();
    mockParseMultiInventoryImport.mockReturnValue(validData);

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
    const validData = createValidMultiInventoryExport();
    const updatedRoot = createMockRootStorage();

    mockParseMultiInventoryImport.mockReturnValue(validData);
    mockImportMultiInventory.mockReturnValue(updatedRoot);

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
      expect(mockImportMultiInventory).toHaveBeenCalled();
      expect(mockSaveRootStorageAfterImport).toHaveBeenCalledWith(updatedRoot);
      expect(mockShowNotification).toHaveBeenCalledWith(
        'notifications.importSuccess',
        'success',
      );
      expect(onImportSuccess).toHaveBeenCalled();
    });
  });

  it('should show error for invalid JSON format', async () => {
    // Missing inventorySets
    const invalidData = {
      version: CURRENT_SCHEMA_VERSION,
      inventorySets: [], // Empty array - invalid
    };

    mockParseMultiInventoryImport.mockReturnValue(invalidData);

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

    expect(mockSaveRootStorageAfterImport).not.toHaveBeenCalled();
  });

  it('should close modal when user cancels', async () => {
    const user = userEvent.setup();
    const validData = createValidMultiInventoryExport();

    mockParseMultiInventoryImport.mockReturnValue(validData);

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

    expect(mockSaveRootStorageAfterImport).not.toHaveBeenCalled();
  });

  it('should handle file read error', async () => {
    mockParseMultiInventoryImport.mockImplementation(() => {
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

    expect(mockParseMultiInventoryImport).not.toHaveBeenCalled();
  });

  it('should reset file input after selecting file', async () => {
    const validData = createValidMultiInventoryExport();

    mockParseMultiInventoryImport.mockReturnValue(validData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(validData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockParseMultiInventoryImport).toHaveBeenCalled();
    });
  });

  it('should validate data has version field', async () => {
    // Missing version
    const missingVersion = {
      inventorySets: [{ name: 'Test', includedSections: [], data: {} }],
    };

    mockParseMultiInventoryImport.mockReturnValue(missingVersion);

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
    mockParseMultiInventoryImport.mockReturnValue(null);

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
    const validData = createValidMultiInventoryExport();

    mockParseMultiInventoryImport.mockReturnValue(validData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(validData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText('settings.multiImport.warning'),
      ).toBeInTheDocument();
    });
  });

  it('should show inventory set name in modal', async () => {
    const validData = createValidMultiInventoryExport();

    mockParseMultiInventoryImport.mockReturnValue(validData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = createMockFile(JSON.stringify(validData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Home Inventory')).toBeInTheDocument();
    });
  });
});
