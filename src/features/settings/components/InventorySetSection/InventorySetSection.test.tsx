import { describe, it, expect, beforeEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventorySetSection } from './InventorySetSection';
import { InventorySetProvider } from '@/features/inventory-set';
import { renderWithProviders } from '@/test/render';
import {
  saveAppData,
  createInventorySet,
  getInventorySetList,
} from '@/shared/utils/storage/localStorage';
import { createMockAppData } from '@/shared/utils/test/factories';

function renderInventorySetSection() {
  return renderWithProviders(
    <InventorySetProvider>
      <InventorySetSection />
    </InventorySetProvider>,
    {
      providers: { settings: true, household: true, inventory: true },
    },
  );
}

describe('InventorySetSection', () => {
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

  it('renders inventory set section with list of inventory sets', () => {
    renderInventorySetSection();
    expect(screen.getByTestId('inventory-set-section')).toBeInTheDocument();
    expect(
      screen.getByRole('list', {
        name: 'settings.inventorySets.inventorySetList',
      }),
    ).toBeInTheDocument();
  });

  it('renders create inventory set input and button', () => {
    renderInventorySetSection();
    expect(
      screen.getByLabelText('settings.inventorySets.newNamePlaceholder'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'settings.inventorySets.addInventorySet',
      }),
    ).toBeInTheDocument();
  });

  it('creates an inventory set when name is entered and add is clicked', async () => {
    const user = userEvent.setup();
    renderInventorySetSection();
    const input = screen.getByLabelText(
      'settings.inventorySets.newNamePlaceholder',
    );
    await user.type(input, 'Car kit');
    await user.click(
      screen.getByRole('button', {
        name: 'settings.inventorySets.addInventorySet',
      }),
    );
    expect(screen.getByText('Car kit')).toBeInTheDocument();
    expect(getInventorySetList()).toHaveLength(2);
  });

  it('creates inventory set with default name when input is empty', async () => {
    const user = userEvent.setup();
    renderInventorySetSection();
    await user.click(
      screen.getByRole('button', {
        name: 'settings.inventorySets.addInventorySet',
      }),
    );
    expect(getInventorySetList()).toHaveLength(2);
  });

  it('shows rename row when rename is clicked and saves on save button', async () => {
    const user = userEvent.setup();
    renderInventorySetSection();
    await user.click(
      screen.getAllByRole('button', {
        name: 'settings.inventorySets.renameLabel',
      })[0],
    );
    const renameInput = screen.getByLabelText(
      'settings.inventorySets.renameLabel',
    ) as HTMLInputElement;
    expect(renameInput).toHaveValue('Default');
    await user.clear(renameInput);
    await user.type(renameInput, 'Main');
    await user.click(screen.getByRole('button', { name: 'common.save' }));
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('cancels rename when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderInventorySetSection();
    await user.click(
      screen.getByRole('button', {
        name: 'settings.inventorySets.renameLabel',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    const section = screen.getByTestId('inventory-set-section');
    expect(within(section).getByText('Default')).toBeInTheDocument();
  });

  it('opens confirm delete dialog when delete is clicked and closes on cancel', async () => {
    createInventorySet('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderInventorySetSection();
    const deleteButtons = screen.getAllByRole('button', {
      name: 'settings.inventorySets.deleteLabel',
    });
    await user.click(deleteButtons[0]);
    expect(
      screen.getByTestId('inventory-set-confirm-delete-dialog'),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId('inventory-set-confirm-cancel-button'));
    expect(
      screen.queryByTestId('inventory-set-confirm-delete-dialog'),
    ).not.toBeInTheDocument();
  });

  it('closes confirm delete dialog on Escape', async () => {
    createInventorySet('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderInventorySetSection();
    await user.click(
      screen.getAllByRole('button', {
        name: 'settings.inventorySets.deleteLabel',
      })[0],
    );
    expect(
      screen.getByTestId('inventory-set-confirm-delete-dialog'),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByTestId('inventory-set-confirm-delete-dialog'),
    ).not.toBeInTheDocument();
  });

  it('restores focus to trigger button when dialog is closed by cancel', async () => {
    createInventorySet('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderInventorySetSection();
    const deleteButtons = screen.getAllByRole('button', {
      name: 'settings.inventorySets.deleteLabel',
    });
    const triggerButton = deleteButtons[0];
    await user.click(triggerButton);
    expect(
      screen.getByTestId('inventory-set-confirm-delete-dialog'),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId('inventory-set-confirm-cancel-button'));
    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton);
    });
  });

  it('deletes inventory set when confirm delete is clicked', async () => {
    createInventorySet('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderInventorySetSection();
    expect(getInventorySetList()).toHaveLength(2);
    const deleteButtons = screen.getAllByRole('button', {
      name: 'settings.inventorySets.deleteLabel',
    });
    await user.click(deleteButtons[1]);
    const dialog = screen.getByTestId('inventory-set-confirm-delete-dialog');
    const confirmBtn = within(dialog).getByTestId(
      'inventory-set-confirm-delete-button',
    );
    await user.click(confirmBtn);
    expect(getInventorySetList()).toHaveLength(1);
    expect(screen.queryByText('To remove')).not.toBeInTheDocument();
  });

  it('focuses primary delete button when confirm dialog opens', async () => {
    createInventorySet('To remove');
    saveAppData(createMockAppData({}));
    const user = userEvent.setup();
    renderInventorySetSection();
    await user.click(
      screen.getAllByRole('button', {
        name: 'settings.inventorySets.deleteLabel',
      })[0],
    );
    const dialog = screen.getByTestId('inventory-set-confirm-delete-dialog');
    const confirmBtn = within(dialog).getByTestId(
      'inventory-set-confirm-delete-button',
    );
    await waitFor(() => {
      expect(document.activeElement).toBe(confirmBtn);
    });
  });

  it('does not show delete button when only one inventory set', () => {
    renderInventorySetSection();
    expect(
      screen.queryByRole('button', {
        name: 'settings.inventorySets.deleteLabel',
      }),
    ).not.toBeInTheDocument();
  });

  it('shows delete button for each inventory set when more than one', async () => {
    const user = userEvent.setup();
    renderInventorySetSection();
    await user.type(
      screen.getByLabelText('settings.inventorySets.newNamePlaceholder'),
      'Second',
    );
    await user.click(
      screen.getByRole('button', {
        name: 'settings.inventorySets.addInventorySet',
      }),
    );
    const deleteButtons = screen.getAllByRole('button', {
      name: 'settings.inventorySets.deleteLabel',
    });
    expect(deleteButtons).toHaveLength(2);
  });
});
