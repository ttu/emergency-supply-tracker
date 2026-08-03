import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemDetail, NEW_ITEM_ID } from './ItemDetail';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockProductTemplate,
  createMockSettings,
} from '@/shared/utils/test/factories';
import {
  createCategoryId,
  createItemId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

const ITEM_ID = createItemId('item-1');

const renderDetail = (
  itemId: string = String(ITEM_ID),
  overrides: { defaultCategoryId?: string } = {},
) => {
  const item = createMockInventoryItem({
    id: ITEM_ID,
    name: 'Bottled water',
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(2),
  });
  return renderWithProviders(
    <ItemDetail itemId={itemId} onBack={vi.fn()} {...overrides} />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [item],
      }),
    },
  );
};

describe('ItemDetail (v2)', () => {
  it('renders breadcrumb, header and side panels for an existing item', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', {
        name: /←\s*v2\.voice\.inventory\.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.itemDetail.captionExisting.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.itemDetail.statusCaption.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.itemDetail.opsCaption.cockpit'),
    ).toBeInTheDocument();
  });

  it('offers the product picker before the blank form', async () => {
    renderDetail(NEW_ITEM_ID, { defaultCategoryId: 'food' });
    expect(
      await screen.findByText('v2.itemDetail.pickTemplate.cockpit'),
    ).toBeInTheDocument();
    // The form itself is not shown until a product (or "custom") is chosen.
    expect(document.querySelector('#name')).not.toBeInTheDocument();
  });

  it('renders NEW ITEM header and hides side panels once past the picker', async () => {
    renderDetail(NEW_ITEM_ID, { defaultCategoryId: 'food' });
    fireEvent.click(await screen.findByRole('button', { name: /custom/i }));
    await waitFor(() => {
      expect(
        screen.getByText('v2.itemDetail.titleNew.cockpit'),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText('v2.itemDetail.statusCaption.cockpit'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('v2.itemDetail.opsCaption.cockpit'),
    ).not.toBeInTheDocument();
  });

  it('shows "Item not found" fallback when itemId does not match', () => {
    renderWithProviders(<ItemDetail itemId="missing-id" onBack={vi.fn()} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [],
      }),
    });
    expect(screen.getByText('v2.itemDetail.notFound')).toBeInTheDocument();
  });

  it('clicking back from the not-found fallback calls onBack', () => {
    const onBack = vi.fn();
    renderWithProviders(<ItemDetail itemId="missing-id" onBack={onBack} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [],
      }),
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.itemDetail.backLink' }),
    );
    expect(onBack).toHaveBeenCalled();
  });

  it('DELETE opens a themed confirm dialog and only deletes when confirmed', async () => {
    const onBack = vi.fn();
    renderWithProviders(
      <ItemDetail itemId={String(ITEM_ID)} onBack={onBack} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [
            createMockInventoryItem({
              id: ITEM_ID,
              name: 'X',
              categoryId: createCategoryId('food'),
            }),
          ],
        }),
      },
    );
    // Header DELETE opens the dialog rather than firing window.confirm.
    await screen.findByRole('button', { name: 'v2.voice.delete.cockpit' });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.delete.cockpit' }),
    );

    // The v2 ConfirmDialog renders with role="alertdialog".
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(onBack).not.toHaveBeenCalled();

    // Cancel closes the dialog without deleting.
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.cancel.cockpit' }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('picking a recommended product seeds the form from it', async () => {
    renderWithProviders(<ItemDetail itemId={NEW_ITEM_ID} onBack={vi.fn()} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [],
      }),
    });

    fireEvent.click(await screen.findByTestId('template-card-bottled-water'));

    expect(document.querySelector('#name')).toBeInTheDocument();
  });

  it("picking one of the household's own templates reaches the form", async () => {
    const template = createMockProductTemplate({
      id: createProductTemplateId('rye-crispbread'),
      name: 'Rye crispbread',
      category: createCategoryId('food'),
      isBuiltIn: false,
      isCustom: true,
    });
    renderWithProviders(<ItemDetail itemId={NEW_ITEM_ID} onBack={vi.fn()} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [],
        customTemplates: [template],
      }),
    });

    fireEvent.click(
      await screen.findByTestId('custom-template-card-rye-crispbread'),
    );

    expect(document.querySelector('#name')).toBeInTheDocument();
  });

  it('offers copy on an existing item and reports its id', async () => {
    const onCopy = vi.fn();
    const item = createMockInventoryItem({
      id: ITEM_ID,
      name: 'Bottled water',
      categoryId: createCategoryId('water-beverages'),
      quantity: createQuantity(2),
    });
    renderWithProviders(
      <ItemDetail itemId={String(ITEM_ID)} onBack={vi.fn()} onCopy={onCopy} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [item],
        }),
      },
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'v2.voice.copy.cockpit' }),
    );
    expect(onCopy).toHaveBeenCalledWith(String(ITEM_ID));
  });
});
