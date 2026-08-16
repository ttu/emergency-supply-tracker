import { describe, it, expect } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { DangerZoneSection } from './DangerZoneSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '@/shared/types';

const setup = (items: ReturnType<typeof createMockInventoryItem>[] = []) =>
  renderWithProviders(<DangerZoneSection />, {
    initialAppData: createMockAppData({
      settings: createMockSettings({ theme: 'cockpit' }),
      items,
    }),
  });

const anItem = (name: string) =>
  createMockInventoryItem({
    name,
    categoryId: createCategoryId('food'),
    quantity: createQuantity(3),
  });

/** The two reset rows, in render order: inventory, then recommendations. */
const resetButton = (which: 'items' | 'recommendations') =>
  screen.getAllByRole('button', { name: /v2\.settings\.danger\..*Btn/ })[
    which === 'items' ? 0 : 1
  ];

describe('DangerZoneSection (v2)', () => {
  it('renders the §11 DANGER ZONE header', () => {
    setup();
    expect(screen.getByText('§11')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.danger.title.cockpit'),
    ).toBeInTheDocument();
  });

  it('asks for confirmation before resetting the inventory', async () => {
    setup([anItem('Canned soup')]);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    fireEvent.click(resetButton('items'));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.danger.resetItemsConfirm.cockpit'),
    ).toBeInTheDocument();
  });

  it('cancelling leaves the inventory alone', async () => {
    setup([anItem('Canned soup')]);
    fireEvent.click(resetButton('items'));
    await screen.findByRole('alertdialog');

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });

  it('confirming clears every item', async () => {
    setup([anItem('Canned soup'), anItem('Bottled water')]);
    fireEvent.click(resetButton('items'));
    const dialog = await screen.findByRole('alertdialog');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'v2.settings.danger.resetItemsBtn.cockpit',
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });

  it('the recommendations reset asks separately, with its own copy', async () => {
    setup();
    fireEvent.click(resetButton('recommendations'));

    await screen.findByRole('alertdialog');
    expect(
      screen.getByText('v2.settings.danger.resetRecsConfirm.cockpit'),
    ).toBeInTheDocument();
  });
});
