import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { ProductPicker } from './ProductPicker';
import { renderWithProviders } from '@/test/render';
import {
  createMockCategory,
  createMockProductTemplate,
  createMockRecommendedItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId, createProductTemplateId } from '@/shared/types';

const water = createMockCategory({
  id: createCategoryId('water-beverages'),
  name: 'Water & Beverages',
  icon: '💧',
  isCustom: false,
});
const food = createMockCategory({
  id: createCategoryId('food'),
  name: 'Food',
  icon: '🍔',
  isCustom: false,
});

const bottledWater = createMockRecommendedItem({
  id: createProductTemplateId('bottled-water'),
  i18nKey: 'products.bottledWater',
  category: 'water-beverages',
});
const cannedSoup = createMockRecommendedItem({
  id: createProductTemplateId('canned-soup'),
  i18nKey: 'products.cannedSoup',
  category: 'food',
});

const renderPicker = (
  overrides: Partial<Parameters<typeof ProductPicker>[0]> = {},
) =>
  renderWithProviders(
    <ProductPicker
      templates={[bottledWater, cannedSoup]}
      customTemplates={[]}
      categories={[water, food]}
      onSelectTemplate={vi.fn()}
      onSelectCustomTemplate={vi.fn()}
      onSelectCustom={vi.fn()}
      {...overrides}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('ProductPicker (v2)', () => {
  it('lists every product when no category is chosen', () => {
    renderPicker();
    expect(screen.getByTestId('template-card-bottled-water')).toBeVisible();
    expect(screen.getByTestId('template-card-canned-soup')).toBeVisible();
  });

  it('hands back the chosen product', () => {
    const onSelectTemplate = vi.fn();
    renderPicker({ onSelectTemplate });
    fireEvent.click(screen.getByTestId('template-card-bottled-water'));
    expect(onSelectTemplate).toHaveBeenCalledWith(bottledWater);
  });

  it('narrows the list to the category picked from the rail', () => {
    renderPicker();
    fireEvent.click(screen.getByTestId('picker-category-chip-food'));
    expect(screen.queryByTestId('template-card-bottled-water')).toBeNull();
    expect(screen.getByTestId('template-card-canned-soup')).toBeVisible();
  });

  it('clicking the active category chip again widens back to all products', () => {
    renderPicker();
    const chip = screen.getByTestId('picker-category-chip-food');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('template-card-bottled-water')).toBeVisible();
  });

  it('offers the category rail as the only category control', () => {
    renderPicker();
    // The rail and a dropdown used to sit on the same screen, both bound to
    // the same filter — two controls for one choice.
    expect(screen.queryByTestId('template-category-select')).toBeNull();
    expect(screen.getByTestId('picker-category-chip-food')).toBeVisible();
  });

  it('starts on the category the user arrived from', () => {
    renderPicker({ initialCategoryId: 'food' });
    expect(screen.queryByTestId('template-card-bottled-water')).toBeNull();
    expect(screen.getByTestId('template-card-canned-soup')).toBeVisible();
  });

  it('filters by search across categories', () => {
    renderPicker();
    fireEvent.change(screen.getByTestId('template-search-input'), {
      target: { value: 'cannedSoup' },
    });
    expect(screen.queryByTestId('template-card-bottled-water')).toBeNull();
    expect(screen.getByTestId('template-card-canned-soup')).toBeVisible();
  });

  it('offers the custom branch', () => {
    const onSelectCustom = vi.fn();
    renderPicker({ onSelectCustom });
    fireEvent.click(screen.getByTestId('custom-item-button'));
    expect(onSelectCustom).toHaveBeenCalledTimes(1);
  });

  it("shows the household's own templates ahead of the recommended ones", () => {
    const mine = createMockProductTemplate({
      id: createProductTemplateId('my-template'),
      name: 'My Template',
      category: 'food',
      isCustom: true,
    });
    const onSelectCustomTemplate = vi.fn();
    renderPicker({ customTemplates: [mine], onSelectCustomTemplate });

    const card = screen.getByTestId('custom-template-card-my-template');
    expect(within(card).getByText('My Template')).toBeVisible();
    fireEvent.click(card);
    expect(onSelectCustomTemplate).toHaveBeenCalledWith(mine);
  });

  it('points at the custom branch when nothing matches', () => {
    renderPicker();
    fireEvent.change(screen.getByTestId('template-search-input'), {
      target: { value: 'nothing-matches-this' },
    });
    expect(screen.getByTestId('picker-empty')).toBeVisible();
    expect(screen.queryByTestId('template-card-canned-soup')).toBeNull();
  });

  it('orders products by their translated name', () => {
    // 'products.bottledWater' < 'products.cannedSoup' under the test
    // translator, which echoes keys back.
    renderPicker();
    const names = screen
      .getAllByTestId(/^template-card-/)
      .map((el) => el.getAttribute('data-testid'));
    expect(names).toEqual([
      'template-card-bottled-water',
      'template-card-canned-soup',
    ]);
  });
});
