import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MobileItemDetail } from './MobileItemDetail';
import { NEW_ITEM_ID } from './ItemDetail';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockProductTemplate,
  createMockSettings,
} from '@/shared/utils/test/factories';
import {
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

describe('MobileItemDetail (v2)', () => {
  it('shows the Item not found fallback for an unknown id', () => {
    renderWithProviders(
      <MobileItemDetail itemId="missing" onBack={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [],
        }),
      },
    );
    expect(screen.getByText('v2.itemDetail.notFound')).toBeInTheDocument();
  });

  it('clicking the back link from the fallback calls onBack', () => {
    const onBack = vi.fn();
    renderWithProviders(<MobileItemDetail itemId="missing" onBack={onBack} />, {
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

  it('shows the product picker first in NEW mode', async () => {
    renderWithProviders(
      <MobileItemDetail itemId={NEW_ITEM_ID} onBack={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
        }),
      },
    );
    expect(
      await screen.findByRole('button', { name: /custom/i }),
    ).toBeInTheDocument();
    expect(document.querySelector('#name')).not.toBeInTheDocument();
  });

  it('choosing "custom" leaves the product picker for the blank form', async () => {
    renderWithProviders(
      <MobileItemDetail itemId={NEW_ITEM_ID} onBack={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
        }),
      },
    );

    fireEvent.click(await screen.findByRole('button', { name: /custom/i }));

    // The blank form, not the picker: adding something the recommendations
    // don't cover must not be a dead end.
    expect(document.querySelector('#name')).toBeInTheDocument();
  });

  it('offers copy on an existing item and reports its id', async () => {
    const onCopy = vi.fn();
    const item = createMockInventoryItem({
      name: 'Bottled water',
      categoryId: createCategoryId('water-beverages'),
      quantity: createQuantity(6),
      neverExpires: true,
    });
    renderWithProviders(
      <MobileItemDetail
        itemId={String(item.id)}
        onBack={vi.fn()}
        onCopy={onCopy}
      />,
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
    expect(onCopy).toHaveBeenCalledWith(String(item.id));
  });

  it('picking a recommended product seeds the form from it', async () => {
    renderWithProviders(
      <MobileItemDetail itemId={NEW_ITEM_ID} onBack={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [],
        }),
      },
    );

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
    renderWithProviders(
      <MobileItemDetail itemId={NEW_ITEM_ID} onBack={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [],
          customTemplates: [template],
        }),
      },
    );

    fireEvent.click(
      await screen.findByTestId('custom-template-card-rye-crispbread'),
    );

    expect(document.querySelector('#name')).toBeInTheDocument();
  });
});
