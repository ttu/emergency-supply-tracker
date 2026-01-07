import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryNav } from './CategoryNav';
import { STANDARD_CATEGORIES } from '@/features/categories';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { ns?: string }) => {
      const categoryTranslations: Record<string, string> = {
        'water-beverages': 'Water & Beverages',
        food: 'Food',
        'cooking-heat': 'Cooking & Heat',
        'light-power': 'Light & Power',
        'communication-info': 'Communication & Info',
        'medical-health': 'Medical & Health',
        'hygiene-sanitation': 'Hygiene & Sanitation',
        'tools-supplies': 'Tools & Supplies',
        'cash-documents': 'Cash & Documents',
      };

      if (options?.ns === 'categories') {
        return categoryTranslations[key] || key;
      }
      return key;
    },
  }),
}));

describe('CategoryNav', () => {
  const onSelectCategory = vi.fn();

  beforeEach(() => {
    onSelectCategory.mockClear();
  });

  it('should render all categories button', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    expect(screen.getByText('inventory.allCategories')).toBeInTheDocument();
  });

  it('should render all provided categories', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    STANDARD_CATEGORIES.forEach((category) => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
  });

  it('should mark "All" as active when no category is selected', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    const allButton = screen
      .getByText('inventory.allCategories')
      .closest('button');
    expect(allButton).toHaveAttribute('aria-current', 'page');
  });

  it('should mark selected category as active', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId="water-beverages"
        onSelectCategory={onSelectCategory}
      />,
    );

    const waterButton = screen.getByText('Water & Beverages').closest('button');
    expect(waterButton).toHaveAttribute('aria-current', 'page');
  });

  it('should call onSelectCategory when clicking All button', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId="water-beverages"
        onSelectCategory={onSelectCategory}
      />,
    );

    const allButton = screen.getByText('inventory.allCategories');
    fireEvent.click(allButton);

    expect(onSelectCategory).toHaveBeenCalledWith(undefined);
  });

  it('should call onSelectCategory when clicking a category', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    const waterButton = screen.getByText('Water & Beverages');
    fireEvent.click(waterButton);

    expect(onSelectCategory).toHaveBeenCalledWith('water-beverages');
  });

  it('should display category icons', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    // Check that icons are rendered (they are in span elements)
    const waterCategory = STANDARD_CATEGORIES.find(
      (c) => c.id === 'water-beverages',
    );
    expect(screen.getByText(waterCategory!.icon!)).toBeInTheDocument();
  });

  it('should be keyboard accessible', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    const allButton = screen
      .getByText('inventory.allCategories')
      .closest('button');
    allButton?.focus();
    expect(allButton).toHaveFocus();
  });

  it('should have title and aria-label attributes for accessibility', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    // Check "All" button
    const allButton = screen
      .getByText('inventory.allCategories')
      .closest('button');
    expect(allButton).toHaveAttribute('title', 'inventory.allCategories');
    expect(allButton).toHaveAttribute('aria-label', 'inventory.allCategories');

    // Check category buttons
    const waterButton = screen.getByText('Water & Beverages').closest('button');
    expect(waterButton).toHaveAttribute('title', 'Water & Beverages');
    expect(waterButton).toHaveAttribute('aria-label', 'Water & Beverages');
  });

  it('should navigate to next category with ArrowRight', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    const nav = screen.getByRole('navigation');
    fireEvent.keyDown(nav, { key: 'ArrowRight' });

    expect(onSelectCategory).toHaveBeenCalledWith('water-beverages');
  });

  it('should navigate to previous category with ArrowLeft', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId="food"
        onSelectCategory={onSelectCategory}
      />,
    );

    const nav = screen.getByRole('navigation');
    fireEvent.keyDown(nav, { key: 'ArrowLeft' });

    expect(onSelectCategory).toHaveBeenCalledWith('water-beverages');
  });

  it('should wrap around to last category when pressing ArrowLeft at start', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    const nav = screen.getByRole('navigation');
    fireEvent.keyDown(nav, { key: 'ArrowLeft' });

    // Should wrap to last category
    expect(onSelectCategory).toHaveBeenCalledWith('cash-documents');
  });

  it('should wrap around to first category when pressing ArrowRight at end', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId="cash-documents"
        onSelectCategory={onSelectCategory}
      />,
    );

    const nav = screen.getByRole('navigation');
    fireEvent.keyDown(nav, { key: 'ArrowRight' });

    // Should wrap to "All" (undefined)
    expect(onSelectCategory).toHaveBeenCalledWith(undefined);
  });

  it('should navigate to first category with Home key', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId="food"
        onSelectCategory={onSelectCategory}
      />,
    );

    const nav = screen.getByRole('navigation');
    fireEvent.keyDown(nav, { key: 'Home' });

    expect(onSelectCategory).toHaveBeenCalledWith(undefined);
  });

  it('should navigate to last category with End key', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    const nav = screen.getByRole('navigation');
    fireEvent.keyDown(nav, { key: 'End' });

    expect(onSelectCategory).toHaveBeenCalledWith('cash-documents');
  });

  it('should not navigate with other keys', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={undefined}
        onSelectCategory={onSelectCategory}
      />,
    );

    const nav = screen.getByRole('navigation');
    fireEvent.keyDown(nav, { key: 'Tab' });

    expect(onSelectCategory).not.toHaveBeenCalled();
  });

  it('should have correct tabIndex for selected item', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId="food"
        onSelectCategory={onSelectCategory}
      />,
    );

    const foodButton = screen.getByTestId('category-food');
    expect(foodButton).toHaveAttribute('tabIndex', '0');

    const waterButton = screen.getByTestId('category-water-beverages');
    expect(waterButton).toHaveAttribute('tabIndex', '-1');
  });
});
