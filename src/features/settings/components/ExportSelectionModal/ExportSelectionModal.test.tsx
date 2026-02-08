import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportSelectionModal } from './ExportSelectionModal';
import type { InventorySetExportInfo } from '@/shared/utils/storage/localStorage';
import { createMockInventorySetData } from '@/shared/utils/test/factories';
import { createInventorySetId } from '@/shared/types';

const createMockInventorySetExportInfo = (
  overrides?: Partial<InventorySetExportInfo>,
): InventorySetExportInfo => {
  const id = overrides?.id ?? createInventorySetId('set-1');
  return {
    id,
    name: overrides?.name ?? 'Home',
    isActive: overrides?.isActive ?? true,
    sectionsWithData: overrides?.sectionsWithData ?? ['items', 'household'],
    data: overrides?.data ?? createMockInventorySetData({ id, name: 'Home' }),
    ...overrides,
  };
};

describe('ExportSelectionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onExport: vi.fn(),
    inventorySets: [createMockInventorySetExportInfo()],
    hasSettings: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title and description', () => {
    render(<ExportSelectionModal {...defaultProps} />);

    expect(
      screen.getByText('settings.exportSelection.title'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.multiExport.description'),
    ).toBeInTheDocument();
  });

  it('renders inventory set name', () => {
    render(<ExportSelectionModal {...defaultProps} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders settings checkbox when hasSettings is true', () => {
    render(<ExportSelectionModal {...defaultProps} hasSettings={true} />);

    expect(
      screen.getByText('settings.exportSelection.sections.settings'),
    ).toBeInTheDocument();
    const settingsCheckbox = screen.getAllByRole('checkbox')[0];
    expect(settingsCheckbox).toBeEnabled();
  });

  it('disables settings checkbox when hasSettings is false', () => {
    render(<ExportSelectionModal {...defaultProps} hasSettings={false} />);

    expect(
      screen.getByText('settings.exportSelection.sections.settings'),
    ).toBeInTheDocument();
    const settingsCheckbox = screen.getAllByRole('checkbox')[0];
    expect(settingsCheckbox).toBeDisabled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ExportSelectionModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText('common.cancel'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onExport with selection when export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<ExportSelectionModal {...defaultProps} onExport={onExport} />);

    await user.click(screen.getByText('settings.exportSelection.exportButton'));

    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({
        includeSettings: true,
        inventorySets: expect.arrayContaining([
          expect.objectContaining({
            sections: expect.arrayContaining(['items', 'household']),
          }),
        ]),
      }),
    );
  });

  it('disables export button when nothing is selected', async () => {
    const user = userEvent.setup();
    render(<ExportSelectionModal {...defaultProps} hasSettings={false} />);

    // Click deselect all to uncheck everything
    await user.click(screen.getByText('settings.exportSelection.deselectAll'));

    expect(
      screen.getByText('settings.exportSelection.exportButton'),
    ).toBeDisabled();
  });

  it('shows select all and deselect all buttons', () => {
    render(<ExportSelectionModal {...defaultProps} />);

    expect(
      screen.getByText('settings.exportSelection.selectAll'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.exportSelection.deselectAll'),
    ).toBeInTheDocument();
  });

  it('handles select all button click', async () => {
    const user = userEvent.setup();
    render(<ExportSelectionModal {...defaultProps} />);

    // First deselect all
    await user.click(screen.getByText('settings.exportSelection.deselectAll'));

    // Then select all
    await user.click(screen.getByText('settings.exportSelection.selectAll'));

    // Export button should be enabled
    expect(
      screen.getByText('settings.exportSelection.exportButton'),
    ).not.toBeDisabled();
  });

  it('handles deselect all button click', async () => {
    const user = userEvent.setup();
    render(<ExportSelectionModal {...defaultProps} hasSettings={false} />);

    await user.click(screen.getByText('settings.exportSelection.deselectAll'));

    expect(
      screen.getByText('settings.exportSelection.exportButton'),
    ).toBeDisabled();
  });

  it('toggles settings checkbox', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<ExportSelectionModal {...defaultProps} onExport={onExport} />);

    // Settings checkbox should be checked by default
    const settingsCheckbox = screen.getAllByRole('checkbox')[0];
    expect(settingsCheckbox).toBeChecked();

    // Uncheck settings
    await user.click(settingsCheckbox);
    expect(settingsCheckbox).not.toBeChecked();

    // Click export
    await user.click(screen.getByText('settings.exportSelection.exportButton'));

    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({
        includeSettings: false,
      }),
    );
  });

  it('renders multiple inventory sets', () => {
    const inventorySets = [
      createMockInventorySetExportInfo({
        id: createInventorySetId('set-1'),
        name: 'Home',
      }),
      createMockInventorySetExportInfo({
        id: createInventorySetId('set-2'),
        name: 'Car',
        isActive: false,
      }),
    ];
    render(
      <ExportSelectionModal {...defaultProps} inventorySets={inventorySets} />,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
  });

  it('expands active inventory set by default', () => {
    const inventorySets = [
      createMockInventorySetExportInfo({
        id: createInventorySetId('set-1'),
        name: 'Home',
        isActive: true,
      }),
      createMockInventorySetExportInfo({
        id: createInventorySetId('set-2'),
        name: 'Car',
        isActive: false,
      }),
    ];
    render(
      <ExportSelectionModal {...defaultProps} inventorySets={inventorySets} />,
    );

    // Active set should have collapse option visible
    expect(
      screen.getByRole('button', { name: /settings.multiExport.collapseSet/i }),
    ).toBeInTheDocument();
  });

  it('toggles inventory set expansion', async () => {
    const user = userEvent.setup();
    render(<ExportSelectionModal {...defaultProps} />);

    // Find and click the expand/collapse button
    const expandButton = screen.getByRole('button', {
      name: /settings.multiExport.collapseSet/i,
    });
    await user.click(expandButton);

    // After collapse, should show expand option
    expect(
      screen.getByRole('button', { name: /settings.multiExport.expandSet/i }),
    ).toBeInTheDocument();
  });

  it('closes modal after export', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onExport = vi.fn();
    render(
      <ExportSelectionModal
        {...defaultProps}
        onClose={onClose}
        onExport={onExport}
      />,
    );

    await user.click(screen.getByText('settings.exportSelection.exportButton'));

    expect(onClose).toHaveBeenCalled();
  });

  it('disables select all button when all is selected', () => {
    render(<ExportSelectionModal {...defaultProps} />);

    // By default all sections are selected, so select all should be disabled
    expect(
      screen.getByText('settings.exportSelection.selectAll'),
    ).toBeDisabled();
  });

  it('disables deselect all button when nothing is selected', async () => {
    const user = userEvent.setup();
    render(<ExportSelectionModal {...defaultProps} hasSettings={false} />);

    // Click deselect all first
    await user.click(screen.getByText('settings.exportSelection.deselectAll'));

    // Now deselect all should be disabled
    expect(
      screen.getByText('settings.exportSelection.deselectAll'),
    ).toBeDisabled();
  });

  it('exports with only selected inventory set sections', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(
      <ExportSelectionModal
        {...defaultProps}
        onExport={onExport}
        hasSettings={false}
      />,
    );

    // Find the items section checkbox within the set and uncheck it
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is settings (disabled), second is set checkbox, then section checkboxes
    // Let's uncheck the set checkbox to deselect all sections in that set
    const setCheckbox = checkboxes[1]; // The inventory set checkbox
    await user.click(setCheckbox);

    // Export should be disabled since no sections selected
    expect(
      screen.getByText('settings.exportSelection.exportButton'),
    ).toBeDisabled();
  });

  it('handles inventory set toggle all selection', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(
      <ExportSelectionModal
        {...defaultProps}
        onExport={onExport}
        hasSettings={false}
      />,
    );

    // Get the set checkbox (second checkbox after settings)
    const checkboxes = screen.getAllByRole('checkbox');
    const setCheckbox = checkboxes[1];

    // Uncheck the set (deselects all sections)
    await user.click(setCheckbox);

    // Check it again (selects all sections)
    await user.click(setCheckbox);

    // Now export
    await user.click(screen.getByText('settings.exportSelection.exportButton'));

    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({
        inventorySets: expect.arrayContaining([
          expect.objectContaining({
            sections: expect.arrayContaining(['items', 'household']),
          }),
        ]),
      }),
    );
  });
});
