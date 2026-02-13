import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportSelectionModal } from './ImportSelectionModal';
import type { MultiInventoryExportData } from '@/shared/types/exportImport';
import { LEGACY_IMPORT_SET_NAME } from '@/shared/types/exportImport';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import {
  createInventorySetId,
  createItemId,
  createCategoryId,
  createQuantity,
} from '@/shared/types';

const createMockImportData = (
  overrides?: Partial<MultiInventoryExportData>,
): MultiInventoryExportData => ({
  version: CURRENT_SCHEMA_VERSION,
  exportedAt: '2024-01-01T00:00:00.000Z',
  appVersion: '1.0.0',
  inventorySets: [
    {
      name: 'Home',
      includedSections: ['items', 'household'],
      data: {
        id: createInventorySetId('set-1'),
        name: 'Home',
        items: [
          {
            id: createItemId('item-1'),
            name: 'Test Item',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    },
  ],
  ...overrides,
});

describe('ImportSelectionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
    importData: createMockImportData(),
    existingInventorySetNames: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title and description', () => {
    render(<ImportSelectionModal {...defaultProps} />);

    expect(
      screen.getByText('settings.importSelection.title'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.multiImport.description'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.multiImport.warning'),
    ).toBeInTheDocument();
  });

  it('renders inventory set name', () => {
    render(<ImportSelectionModal {...defaultProps} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders settings checkbox when settings are included', () => {
    const importData = createMockImportData({
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
    });
    render(<ImportSelectionModal {...defaultProps} importData={importData} />);

    expect(
      screen.getByText('settings.exportSelection.sections.settings'),
    ).toBeInTheDocument();
  });

  it('does not render settings checkbox when settings are not included', () => {
    const importData = createMockImportData({ settings: undefined });
    render(<ImportSelectionModal {...defaultProps} importData={importData} />);

    expect(
      screen.queryByText('settings.exportSelection.sections.settings'),
    ).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ImportSelectionModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText('common.cancel'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onImport with selection when import button is clicked', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<ImportSelectionModal {...defaultProps} onImport={onImport} />);

    await user.click(screen.getByText('settings.importSelection.importButton'));

    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({
        includeSettings: false,
        inventorySets: expect.arrayContaining([
          expect.objectContaining({
            index: 0,
            originalName: 'Home',
          }),
        ]),
      }),
    );
  });

  it('disables import button when nothing is selected', async () => {
    const user = userEvent.setup();
    render(<ImportSelectionModal {...defaultProps} />);

    // Click the inventory set checkbox to deselect it
    const checkboxes = screen.getAllByRole('checkbox');
    // Find the main inventory set checkbox and click to deselect
    const setCheckbox = checkboxes[0]; // First checkbox is the set checkbox
    await user.click(setCheckbox);

    expect(
      screen.getByText('settings.importSelection.importButton'),
    ).toBeDisabled();
  });

  it('shows select all and deselect all buttons', () => {
    render(<ImportSelectionModal {...defaultProps} />);

    expect(
      screen.getByText('settings.exportSelection.selectAll'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.exportSelection.deselectAll'),
    ).toBeInTheDocument();
  });

  it('handles select all button click', async () => {
    const user = userEvent.setup();
    const importData = createMockImportData({
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
    });
    render(<ImportSelectionModal {...defaultProps} importData={importData} />);

    // First deselect all
    await user.click(screen.getByText('settings.exportSelection.deselectAll'));

    // Then select all
    await user.click(screen.getByText('settings.exportSelection.selectAll'));

    // Import button should be enabled
    expect(
      screen.getByText('settings.importSelection.importButton'),
    ).not.toBeDisabled();
  });

  it('handles deselect all button click', async () => {
    const user = userEvent.setup();
    render(<ImportSelectionModal {...defaultProps} />);

    await user.click(screen.getByText('settings.exportSelection.deselectAll'));

    expect(
      screen.getByText('settings.importSelection.importButton'),
    ).toBeDisabled();
  });

  it('shows conflict warning for duplicate names', () => {
    render(
      <ImportSelectionModal
        {...defaultProps}
        existingInventorySetNames={['Home']}
      />,
    );

    // Should show conflict warning message
    expect(
      screen.getByText(/settings.multiImport.conflictWarning/),
    ).toBeInTheDocument();
  });

  it('displays legacy import name correctly', () => {
    const importData = createMockImportData({
      inventorySets: [
        {
          name: LEGACY_IMPORT_SET_NAME,
          includedSections: ['items'],
          data: {
            id: createInventorySetId(''),
            name: LEGACY_IMPORT_SET_NAME,
            items: [],
          },
        },
      ],
    });
    render(<ImportSelectionModal {...defaultProps} importData={importData} />);

    // Legacy set name should be translated
    expect(
      screen.getByText('settings.import.legacySetName'),
    ).toBeInTheDocument();
  });

  it('toggles settings checkbox', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const importData = createMockImportData({
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
    });
    render(
      <ImportSelectionModal
        {...defaultProps}
        importData={importData}
        onImport={onImport}
      />,
    );

    // Settings checkbox should be checked by default
    const settingsCheckbox = screen.getAllByRole('checkbox')[0];
    expect(settingsCheckbox).toBeChecked();

    // Uncheck settings
    await user.click(settingsCheckbox);
    expect(settingsCheckbox).not.toBeChecked();

    // Click import
    await user.click(screen.getByText('settings.importSelection.importButton'));

    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({
        includeSettings: false,
      }),
    );
  });

  it('renders multiple inventory sets', () => {
    const importData = createMockImportData({
      inventorySets: [
        {
          name: 'Home',
          includedSections: ['items'],
          data: {
            id: createInventorySetId('set-1'),
            name: 'Home',
            items: [],
          },
        },
        {
          name: 'Car',
          includedSections: ['items'],
          data: {
            id: createInventorySetId('set-2'),
            name: 'Car',
            items: [],
          },
        },
      ],
    });
    render(<ImportSelectionModal {...defaultProps} importData={importData} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
  });

  it('expands inventory set by default to show sections', () => {
    render(<ImportSelectionModal {...defaultProps} />);

    // Section checkboxes should be visible (items, household)
    const checkboxes = screen.getAllByRole('checkbox');
    // At least the set checkbox + section checkboxes should be present
    expect(checkboxes.length).toBeGreaterThan(1);
  });

  it('toggles inventory set expansion', async () => {
    const user = userEvent.setup();
    render(<ImportSelectionModal {...defaultProps} />);

    // Find and click the expand button
    const expandButton = screen.getByRole('button', {
      name: /settings.multiExport.collapseSet/i,
    });
    await user.click(expandButton);

    // After collapse, should show expand option
    expect(
      screen.getByRole('button', { name: /settings.multiExport.expandSet/i }),
    ).toBeInTheDocument();
  });
});
