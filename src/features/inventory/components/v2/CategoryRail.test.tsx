import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { CategoryRail } from './CategoryRail';
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
const shed = createMockCategory({
  id: createCategoryId('garden-shed'),
  name: 'Garden Shed',
  names: { en: 'Garden Shed', fi: 'Puutarhavaja' },
  isCustom: true,
});

const row = (categoryId: string): DesignItemRow =>
  ({
    item: createMockInventoryItem({ categoryId: createCategoryId(categoryId) }),
    status: 'ok',
    categoryCode: 'X',
    recommended: 1,
  }) as unknown as DesignItemRow;

const rows = [
  row('water-beverages'),
  row('water-beverages'),
  row('water-beverages'),
  row('food'),
];

const renderRail = (
  overrides: Partial<Parameters<typeof CategoryRail>[0]> = {},
) =>
  renderWithProviders(
    <CategoryRail
      categories={[water, food, shed]}
      rows={rows}
      onCategoryChange={vi.fn()}
      {...overrides}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('CategoryRail (v2)', () => {
  it('lists All plus every category', () => {
    renderRail();
    expect(screen.getByTestId('v2-category-row-all')).toBeVisible();
    expect(screen.getByTestId('v2-category-row-water-beverages')).toBeVisible();
    expect(screen.getByTestId('v2-category-row-food')).toBeVisible();
    expect(screen.getByTestId('v2-category-row-garden-shed')).toBeVisible();
  });

  it('counts the items in each category, and all of them under All', () => {
    renderRail();
    expect(
      within(screen.getByTestId('v2-category-row-water-beverages')).getByText(
        '3',
      ),
    ).toBeVisible();
    expect(
      within(screen.getByTestId('v2-category-row-food')).getByText('1'),
    ).toBeVisible();
    expect(
      within(screen.getByTestId('v2-category-row-all')).getByText('4'),
    ).toBeVisible();
  });

  it('shows zero for a category holding nothing, rather than omitting it', () => {
    renderRail();
    expect(
      within(screen.getByTestId('v2-category-row-garden-shed')).getByText('0'),
    ).toBeVisible();
  });

  it('names a custom category from its own translations', () => {
    renderRail();
    expect(
      within(screen.getByTestId('v2-category-row-garden-shed')).getByText(
        'Garden Shed',
      ),
    ).toBeVisible();
  });

  it('selects a category', () => {
    const onCategoryChange = vi.fn();
    renderRail({ onCategoryChange });
    fireEvent.click(screen.getByTestId('v2-category-row-food'));
    expect(onCategoryChange).toHaveBeenCalledWith('food');
  });

  it('All clears the filter rather than passing an id', () => {
    const onCategoryChange = vi.fn();
    renderRail({ selectedCategoryId: 'food', onCategoryChange });
    fireEvent.click(screen.getByTestId('v2-category-row-all'));
    expect(onCategoryChange).toHaveBeenCalledWith(undefined);
  });

  it('marks the selected row, and only that one', () => {
    renderRail({ selectedCategoryId: 'food' });
    expect(screen.getByTestId('v2-category-row-food')).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      screen.getByTestId('v2-category-row-water-beverages'),
    ).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('v2-category-row-all')).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks All when nothing is selected', () => {
    renderRail();
    expect(screen.getByTestId('v2-category-row-all')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });
});
