import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventorySetExportSection } from './InventorySetExportSection';
import type { InventorySetSection } from '@/shared/types/exportImport';
import { createItemId, createCategoryId, createQuantity } from '@/shared/types';

const createMockItem = (id: string, name: string) => ({
  id: createItemId(id),
  name,
  itemType: 'custom' as const,
  categoryId: createCategoryId('food'),
  quantity: createQuantity(1),
  unit: 'pieces' as const,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

const createMockHousehold = () => ({
  adults: 2,
  children: 0,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: false,
});

describe('InventorySetExportSection', () => {
  const defaultProps = {
    name: 'Home',
    isExpanded: true,
    onToggleExpanded: vi.fn(),
    selectedSections: new Set<InventorySetSection>(['items', 'household']),
    onToggleSection: vi.fn(),
    onToggleAll: vi.fn(),
    data: {
      items: [createMockItem('item-1', 'Test Item')],
      household: createMockHousehold(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders inventory set name', () => {
    render(<InventorySetExportSection {...defaultProps} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders active badge when isActive is true', () => {
    render(<InventorySetExportSection {...defaultProps} isActive={true} />);

    expect(
      screen.getByText('settings.inventorySets.active'),
    ).toBeInTheDocument();
  });

  it('does not render active badge when isActive is false', () => {
    render(<InventorySetExportSection {...defaultProps} isActive={false} />);

    expect(
      screen.queryByText('settings.inventorySets.active'),
    ).not.toBeInTheDocument();
  });

  it('shows section list when expanded', () => {
    render(<InventorySetExportSection {...defaultProps} isExpanded={true} />);

    expect(
      screen.getByText('settings.exportSelection.sections.items'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.exportSelection.sections.household'),
    ).toBeInTheDocument();
  });

  it('hides section list when collapsed', () => {
    render(<InventorySetExportSection {...defaultProps} isExpanded={false} />);

    expect(
      screen.queryByText('settings.exportSelection.sections.items'),
    ).not.toBeInTheDocument();
  });

  it('calls onToggleExpanded when expand button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleExpanded = vi.fn();
    render(
      <InventorySetExportSection
        {...defaultProps}
        onToggleExpanded={onToggleExpanded}
      />,
    );

    const expandButton = screen.getByRole('button', {
      name: /settings.multiExport.collapseSet/i,
    });
    await user.click(expandButton);

    expect(onToggleExpanded).toHaveBeenCalled();
  });

  it('calls onToggleSection when section checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onToggleSection = vi.fn();
    render(
      <InventorySetExportSection
        {...defaultProps}
        onToggleSection={onToggleSection}
      />,
    );

    const sectionCheckboxes = screen.getAllByRole('checkbox');
    // Skip the first checkbox (set checkbox) and click a section checkbox
    await user.click(sectionCheckboxes[1]);

    expect(onToggleSection).toHaveBeenCalled();
  });

  it('calls onToggleAll when set checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onToggleAll = vi.fn();
    render(
      <InventorySetExportSection {...defaultProps} onToggleAll={onToggleAll} />,
    );

    const setCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(setCheckbox);

    expect(onToggleAll).toHaveBeenCalledWith(false); // Currently all selected, so clicking toggles to false
  });

  it('shows conflict warning when provided', () => {
    render(
      <InventorySetExportSection
        {...defaultProps}
        conflictWarning="This name already exists"
      />,
    );

    expect(screen.getByText('This name already exists')).toBeInTheDocument();
  });

  it('does not show conflict warning when not provided', () => {
    render(<InventorySetExportSection {...defaultProps} />);

    expect(
      screen.queryByText('This name already exists'),
    ).not.toBeInTheDocument();
  });

  it('renders only available sections when availableSections is specified', () => {
    render(
      <InventorySetExportSection
        {...defaultProps}
        availableSections={['items']}
      />,
    );

    // Only items section should be visible (filtered by availableSections)
    expect(
      screen.getByText('settings.exportSelection.sections.items'),
    ).toBeInTheDocument();
    // Other sections should not appear when availableSections is specified
    expect(
      screen.queryByText('settings.exportSelection.sections.customCategories'),
    ).not.toBeInTheDocument();
  });

  it('disables sections without data when availableSections is specified', () => {
    render(
      <InventorySetExportSection
        {...defaultProps}
        availableSections={['items', 'household']}
        selectedSections={new Set(['items'])}
      />,
    );

    // Items should be enabled (it's in availableSections)
    const itemsLabel = screen
      .getByText('settings.exportSelection.sections.items')
      .closest('label');
    const itemsCheckbox = itemsLabel?.querySelector('input');
    expect(itemsCheckbox).not.toBeDisabled();
  });

  it('disables sections without data in export mode', () => {
    render(
      <InventorySetExportSection
        {...defaultProps}
        data={{ items: [] }} // No items
        selectedSections={new Set<InventorySetSection>()}
      />,
    );

    // Items checkbox should be disabled (no data)
    const itemsLabel = screen
      .getByText('settings.exportSelection.sections.items')
      .closest('label');
    const itemsCheckbox = itemsLabel?.querySelector('input');
    expect(itemsCheckbox).toBeDisabled();
  });

  it('shows count for sections with data', () => {
    render(
      <InventorySetExportSection
        {...defaultProps}
        data={{
          items: [createMockItem('1', 'Item 1'), createMockItem('2', 'Item 2')],
          household: createMockHousehold(),
        }}
      />,
    );

    // Items should show count
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('does not show count for household section', () => {
    render(
      <InventorySetExportSection
        {...defaultProps}
        data={{
          household: createMockHousehold(),
        }}
        selectedSections={new Set(['household'])}
      />,
    );

    // Household section should not have (1) count displayed
    const householdLabel = screen
      .getByText('settings.exportSelection.sections.household')
      .closest('label');
    expect(householdLabel?.textContent).not.toContain('(1)');
  });

  it('shows (0) for empty sections in export mode', () => {
    render(
      <InventorySetExportSection
        {...defaultProps}
        data={{ items: [] }}
        selectedSections={new Set<InventorySetSection>()}
      />,
    );

    // Multiple sections may have (0), so check that at least one exists
    const zeroCountElements = screen.getAllByText('(0)');
    expect(zeroCountElements.length).toBeGreaterThan(0);
  });

  it('does not show (0) for empty sections in import mode with availableSections', () => {
    render(
      <InventorySetExportSection
        {...defaultProps}
        data={{ items: [] }}
        availableSections={['items']}
        selectedSections={new Set(['items'])}
      />,
    );

    // In import mode (with availableSections), empty counts should not be shown
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('handles partial selection correctly', async () => {
    const user = userEvent.setup();
    const onToggleAll = vi.fn();
    render(
      <InventorySetExportSection
        {...defaultProps}
        onToggleAll={onToggleAll}
        selectedSections={new Set(['items'])} // Only items selected, not household
        data={{
          items: [createMockItem('1', 'Item')],
          household: createMockHousehold(),
        }}
      />,
    );

    // Set checkbox should be in indeterminate state (partial selection)
    const setCheckbox = screen.getAllByRole('checkbox')[0];
    // Click to select all
    await user.click(setCheckbox);

    // Since partial, clicking should select all (true)
    expect(onToggleAll).toHaveBeenCalledWith(true);
  });

  it('shows expand icon when collapsed', () => {
    render(<InventorySetExportSection {...defaultProps} isExpanded={false} />);

    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('shows collapse icon when expanded', () => {
    render(<InventorySetExportSection {...defaultProps} isExpanded={true} />);

    expect(screen.getByText('▼')).toBeInTheDocument();
  });
});
