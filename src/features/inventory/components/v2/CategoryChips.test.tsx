import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { CategoryChips } from './CategoryChips';
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

const renderChips = (
  overrides: Partial<Parameters<typeof CategoryChips>[0]> = {},
) =>
  renderWithProviders(
    <CategoryChips
      categories={[water, food]}
      rows={rows}
      onCategoryChange={vi.fn()}
      {...overrides}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('CategoryChips (v2 mobile)', () => {
  it('offers All plus every category, with counts', () => {
    renderChips();
    expect(
      within(screen.getByTestId('v2-category-chip-all')).getByText('3'),
    ).toBeVisible();
    expect(
      within(screen.getByTestId('v2-category-chip-water-beverages')).getByText(
        '2',
      ),
    ).toBeVisible();
    expect(
      within(screen.getByTestId('v2-category-chip-food')).getByText('1'),
    ).toBeVisible();
  });

  it('selects a category', () => {
    const onCategoryChange = vi.fn();
    renderChips({ onCategoryChange });
    fireEvent.click(screen.getByTestId('v2-category-chip-food'));
    expect(onCategoryChange).toHaveBeenCalledWith('food');
  });

  it('All clears the filter', () => {
    const onCategoryChange = vi.fn();
    renderChips({ selectedCategoryId: 'food', onCategoryChange });
    fireEvent.click(screen.getByTestId('v2-category-chip-all'));
    expect(onCategoryChange).toHaveBeenCalledWith(undefined);
  });

  it('marks the selected chip pressed, and only that one', () => {
    renderChips({ selectedCategoryId: 'food' });
    expect(screen.getByTestId('v2-category-chip-food')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByTestId('v2-category-chip-all')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('scrolls rather than wrapping — chips must not be squashed', () => {
    const { container } = renderChips();
    const strip = container.querySelector('[role="group"]') as HTMLElement;
    expect(strip.style.overflowX).toBe('auto');
    expect(strip.style.flexWrap).toBe('nowrap');
  });
});
