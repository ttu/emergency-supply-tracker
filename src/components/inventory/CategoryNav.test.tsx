import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryNav } from './CategoryNav';
import { STANDARD_CATEGORIES } from '../../data/standardCategories';

// Mock i18next
jest.mock('react-i18next', () => ({
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
  const onSelectCategory = jest.fn();

  beforeEach(() => {
    onSelectCategory.mockClear();
  });

  it('should render all categories button', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={null}
        onSelectCategory={onSelectCategory}
      />,
    );

    expect(screen.getByText('inventory.allCategories')).toBeInTheDocument();
  });

  it('should render all provided categories', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={null}
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
        selectedCategoryId={null}
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

    expect(onSelectCategory).toHaveBeenCalledWith(null);
  });

  it('should call onSelectCategory when clicking a category', () => {
    render(
      <CategoryNav
        categories={STANDARD_CATEGORIES}
        selectedCategoryId={null}
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
        selectedCategoryId={null}
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
        selectedCategoryId={null}
        onSelectCategory={onSelectCategory}
      />,
    );

    const allButton = screen
      .getByText('inventory.allCategories')
      .closest('button');
    allButton?.focus();
    expect(allButton).toHaveFocus();
  });
});
