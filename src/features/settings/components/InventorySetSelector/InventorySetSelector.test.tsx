import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventorySetSelector } from './InventorySetSelector';
import { InventorySetProvider } from '@/features/inventory-set';
import { renderWithProviders } from '@/test/render';
import {
  saveAppData,
  createInventorySet,
} from '@/shared/utils/storage/localStorage';
import { createMockAppData } from '@/shared/utils/test/factories';
import { LEGACY_IMPORT_SET_NAME } from '@/shared/types/exportImport';

function renderInventorySetSelector(onManageClick = vi.fn()) {
  return {
    onManageClick,
    ...renderWithProviders(
      <InventorySetProvider>
        <InventorySetSelector onManageClick={onManageClick} />
      </InventorySetProvider>,
      {
        providers: { settings: true, household: true, inventory: true },
      },
    ),
  };
}

describe('InventorySetSelector', () => {
  beforeEach(() => {
    localStorage.clear();
    const data = createMockAppData({
      settings: {
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
        onboardingCompleted: true,
      },
    });
    saveAppData(data);
  });

  it('renders inventory set selector', () => {
    renderInventorySetSelector();
    expect(screen.getByTestId('inventory-set-selector')).toBeInTheDocument();
    expect(
      screen.getByLabelText('settings.inventorySetSelector.label'),
    ).toBeInTheDocument();
  });

  it('calls onManageClick when manage button is clicked', async () => {
    const user = userEvent.setup();
    const { onManageClick } = renderInventorySetSelector();

    await user.click(
      screen.getByRole('button', {
        name: 'settings.inventorySetSelector.manageLabel',
      }),
    );

    expect(onManageClick).toHaveBeenCalledTimes(1);
  });

  it('disables select when only one inventory set exists', () => {
    renderInventorySetSelector();
    const select = screen.getByLabelText('settings.inventorySetSelector.label');
    expect(select).toBeDisabled();
  });

  it('enables select when multiple inventory sets exist', () => {
    createInventorySet('Second Set');
    saveAppData(createMockAppData({}));

    renderInventorySetSelector();
    const select = screen.getByLabelText('settings.inventorySetSelector.label');
    expect(select).not.toBeDisabled();
  });

  it('changes active inventory set when different option selected', async () => {
    createInventorySet('Second Set');
    saveAppData(createMockAppData({}));

    const user = userEvent.setup();
    renderInventorySetSelector();

    const select = screen.getByLabelText(
      'settings.inventorySetSelector.label',
    ) as HTMLSelectElement;
    const initialValue = select.value;

    // Select the second option (Second Set)
    const options = screen.getAllByRole('option');
    const secondSetOption = options.find(
      (opt) => opt.textContent === 'Second Set',
    );
    expect(secondSetOption).toBeDefined();
    await user.selectOptions(select, secondSetOption!);

    // Value should have changed
    expect(select.value).not.toBe(initialValue);
  });

  it('displays legacy import set name with translated label', () => {
    createInventorySet(LEGACY_IMPORT_SET_NAME);
    saveAppData(createMockAppData({}));

    renderInventorySetSelector();

    // The legacy import set name should be translated
    expect(
      screen.getByText('settings.import.legacySetName'),
    ).toBeInTheDocument();
  });

  it('displays regular set names as-is', () => {
    createInventorySet('My Custom Set');
    saveAppData(createMockAppData({}));

    renderInventorySetSelector();

    expect(screen.getByText('My Custom Set')).toBeInTheDocument();
  });

  it('renders as a section element with aria-label for accessibility', () => {
    renderInventorySetSelector();
    const section = screen.getByTestId('inventory-set-selector');
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveAttribute(
      'aria-label',
      'settings.inventorySetSelector.regionLabel',
    );
  });
});
