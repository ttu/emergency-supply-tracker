import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from './ExportButton';
import * as localStorage from '@/shared/utils/storage/localStorage';
import {
  createMockAppData,
  createMockRootStorage,
} from '@/shared/utils/test/factories';
import {
  createItemId,
  createCategoryId,
  createQuantity,
  createInventorySetId,
} from '@/shared/types';
import type { InventorySetExportInfo } from '@/shared/utils/storage/localStorage';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getRootStorageForExport: vi.fn(),
  getInventorySetsForExport: vi.fn(),
  exportMultiInventory: vi.fn(),
  hasSettingsData: vi.fn(),
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
  createDefaultAppData: vi.fn(() => createMockAppData()),
}));

const mockShowNotification = vi.fn();
vi.mock('@/shared/hooks/useNotification', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

function createMockInventorySetExportInfo(
  overrides?: Partial<InventorySetExportInfo>,
): InventorySetExportInfo {
  const defaultId = createInventorySetId('default');
  return {
    id: defaultId,
    name: 'Default',
    isActive: true,
    sectionsWithData: ['items', 'household'],
    data: {
      id: defaultId,
      name: 'Default',
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
      items: [],
      customCategories: [],
      customTemplates: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: [],
      lastModified: new Date().toISOString(),
    },
    ...overrides,
  };
}

describe('ExportButton', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    // Set default mock return values
    (localStorage.getRootStorageForExport as Mock).mockReturnValue(
      createMockRootStorage(),
    );
    (localStorage.getInventorySetsForExport as Mock).mockReturnValue([
      createMockInventorySetExportInfo(),
    ]);
    (localStorage.hasSettingsData as Mock).mockReturnValue(true);

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
    render(<ExportButton />);

    expect(screen.getByText('settings.export.button')).toBeInTheDocument();
    expect(screen.getByText('settings.export.description')).toBeInTheDocument();
  });

  it('should show alert when no data to export', () => {
    (localStorage.getRootStorageForExport as Mock).mockReturnValue(null);

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    expect(globalThis.alert).toHaveBeenCalledWith('settings.export.noData');
  });

  it('should open selection modal when data is available', async () => {
    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Modal should open with selection options
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });
  });

  it('should export data when user confirms selection', async () => {
    const user = userEvent.setup();

    (localStorage.exportMultiInventory as Mock).mockReturnValue(
      JSON.stringify({ inventorySets: [] }),
    );

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Click export button in modal
    const exportButton = screen.getByText(
      'settings.exportSelection.exportButton',
    );
    await user.click(exportButton);

    await waitFor(() => {
      expect(localStorage.exportMultiInventory).toHaveBeenCalled();
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('should close modal when user cancels', async () => {
    const user = userEvent.setup();

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Click cancel button in modal
    const cancelButton = screen.getByText('common.cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('settings.exportSelection.title'),
      ).not.toBeInTheDocument();
    });
  });

  it('should show inventory set in modal', async () => {
    const mockInventorySets = [
      createMockInventorySetExportInfo({
        name: 'Home Inventory',
        isActive: true,
        sectionsWithData: ['items', 'household'],
        data: {
          id: createInventorySetId('home'),
          name: 'Home Inventory',
          household: {
            adults: 2,
            children: 0,
            pets: 0,
            supplyDurationDays: 3,
            useFreezer: false,
          },
          items: [
            {
              id: createItemId('1'),
              name: 'Test Item 1',
              itemType: 'custom',
              categoryId: createCategoryId('food'),
              quantity: createQuantity(1),
              unit: 'pieces',
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
            {
              id: createItemId('2'),
              name: 'Test Item 2',
              itemType: 'custom',
              categoryId: createCategoryId('food'),
              quantity: createQuantity(2),
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
          lastModified: new Date().toISOString(),
        },
      }),
    ];

    (localStorage.getInventorySetsForExport as Mock).mockReturnValue(
      mockInventorySets,
    );

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Should show inventory set name
    expect(screen.getByText('Home Inventory')).toBeInTheDocument();
  });

  it('should have all sections selected by default', async () => {
    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Check that checkboxes are checked (they should be selected by default)
    const checkboxes = screen.getAllByRole('checkbox');
    const enabledCheckboxes = checkboxes.filter(
      (cb) => !cb.hasAttribute('disabled'),
    );

    enabledCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('should show error notification when export fails', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    (localStorage.exportMultiInventory as Mock).mockImplementation(() => {
      throw new Error('Export failed');
    });

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Click export button in modal
    const exportButton = screen.getByText(
      'settings.exportSelection.exportButton',
    );
    await user.click(exportButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Export error:',
        expect.any(Error),
      );
      expect(mockShowNotification).toHaveBeenCalledWith(
        'notifications.exportError',
        'error',
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
