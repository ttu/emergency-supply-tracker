import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { CategorySelect } from './CategorySelect';
import { renderWithProviders } from '@/test/render';
import {
  createMockCategory,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';

const water = createMockCategory({
  id: createCategoryId('water-beverages'),
  name: 'Water & Beverages',
  isCustom: false,
});
const food = createMockCategory({
  id: createCategoryId('food'),
  name: 'Food',
  isCustom: false,
});

const row = (categoryId: string): DesignItemRow =>
  ({
    item: createMockInventoryItem({ categoryId: createCategoryId(categoryId) }),
    status: 'ok',
    categoryCode: 'X',
    recommended: 1,
  }) as unknown as DesignItemRow;

const rows = [row('water-beverages'), row('water-beverages'), row('food')];

const renderSelect = (
  overrides: Partial<Parameters<typeof CategorySelect>[0]> = {},
) =>
  renderWithProviders(
    <CategorySelect
      categories={[water, food]}
      rows={rows}
      onCategoryChange={vi.fn()}
      {...overrides}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

const select = () => screen.getByTestId('v2-category-select');

describe('CategorySelect (v2 mobile)', () => {
  it('offers All plus every category, with counts', () => {
    renderSelect();
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual([
      'v2.inventory.categoryAll.cockpit (3)',
      'Water & Beverages (2)',
      'Food (1)',
    ]);
  });

  it('selects a category', () => {
    const onCategoryChange = vi.fn();
    renderSelect({ onCategoryChange });
    fireEvent.change(select(), { target: { value: 'food' } });
    expect(onCategoryChange).toHaveBeenCalledWith('food');
  });

  it('All clears the filter', () => {
    const onCategoryChange = vi.fn();
    renderSelect({ selectedCategoryId: 'food', onCategoryChange });
    fireEvent.change(select(), { target: { value: '' } });
    expect(onCategoryChange).toHaveBeenCalledWith(undefined);
  });

  it('shows the selected category as the current value', () => {
    renderSelect({ selectedCategoryId: 'food' });
    expect(select()).toHaveValue('food');
  });

  it('falls back to All when nothing is selected', () => {
    renderSelect();
    expect(select()).toHaveValue('');
  });
});
