import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryCard } from './CategoryCard';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const categoryTranslations: Record<string, string> = {
        'water-beverages': 'Water & Beverages',
        food: 'Food',
        'medical-health': 'Medical & Health',
      };

      const unitTranslations: Record<string, string> = {
        liters: 'L',
        pieces: 'pcs',
        cans: 'cans',
      };

      const commonTranslations: Record<string, string> = {
        'status.ok': 'OK',
        'status.warning': 'Warning',
        'status.critical': 'Critical',
        'dashboard.category.items': 'items',
        'dashboard.category.stocked': 'Stocked',
        'dashboard.category.completion': 'Completion',
        'dashboard.category.missing': 'Need {{count}} {{unit}} {{item}}',
        'dashboard.category.missingMultiple':
          'Need {{count}} {{unit}} {{item}} +{{more}} more',
        'dashboard.category.kcal': 'kcal',
        'dashboard.category.missingCalories': 'Need {{count}} kcal more',
      };

      if (options?.ns === 'categories') {
        return categoryTranslations[key] || key;
      }
      if (options?.ns === 'units') {
        return unitTranslations[key] || key;
      }

      let result = commonTranslations[key] || key;

      // Handle interpolation
      if (options) {
        Object.entries(options).forEach(([optKey, optValue]) => {
          if (optKey !== 'ns') {
            result = result.replace(
              new RegExp(`\\{\\{${optKey}\\}\\}`, 'g'),
              String(optValue),
            );
          }
        });
      }

      return result;
    },
  }),
}));

describe('CategoryCard', () => {
  it('renders category name', () => {
    render(
      <CategoryCard
        categoryId="water-beverages"
        itemCount={12}
        status="ok"
        completionPercentage={95}
      />,
    );

    expect(screen.getByText('Water & Beverages')).toBeInTheDocument();
  });

  it('renders item count when no shortage data', () => {
    render(
      <CategoryCard
        categoryId="food"
        itemCount={18}
        status="ok"
        completionPercentage={85}
      />,
    );

    expect(screen.getByText('18 items')).toBeInTheDocument();
  });

  it('renders stocked quantity when shortage data is provided', () => {
    render(
      <CategoryCard
        categoryId="water-beverages"
        itemCount={3}
        status="warning"
        completionPercentage={50}
        totalActual={54}
        totalNeeded={108}
        primaryUnit="liters"
        shortages={[
          {
            itemId: 'bottled-water',
            itemName: 'products.bottled-water',
            actual: 54,
            needed: 108,
            unit: 'liters',
            missing: 54,
          },
        ]}
      />,
    );

    expect(screen.getByText('54 / 108 L')).toBeInTheDocument();
  });

  it('renders completion percentage', () => {
    render(
      <CategoryCard
        categoryId="medical-health"
        itemCount={5}
        status="warning"
        completionPercentage={60}
      />,
    );

    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders status badge with correct variant', () => {
    render(
      <CategoryCard
        categoryId="food"
        itemCount={10}
        status="ok"
        completionPercentage={90}
      />,
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('calls onCategoryClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onCategoryClick = vi.fn();

    render(
      <CategoryCard
        categoryId="water-beverages"
        itemCount={12}
        status="ok"
        completionPercentage={95}
        onCategoryClick={onCategoryClick}
      />,
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(onCategoryClick).toHaveBeenCalledWith('water-beverages');
  });

  it('has button role when onCategoryClick is provided', () => {
    render(
      <CategoryCard
        categoryId="food"
        itemCount={10}
        status="ok"
        completionPercentage={90}
        onCategoryClick={() => {}}
      />,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not have button role when onCategoryClick is not provided', () => {
    render(
      <CategoryCard
        categoryId="food"
        itemCount={10}
        status="ok"
        completionPercentage={90}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles keyboard interaction when clickable', async () => {
    const user = userEvent.setup();
    const onCategoryClick = vi.fn();

    render(
      <CategoryCard
        categoryId="food"
        itemCount={10}
        status="ok"
        completionPercentage={90}
        onCategoryClick={onCategoryClick}
      />,
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(onCategoryClick).toHaveBeenCalledWith('food');
  });

  it('renders calories for food category', () => {
    render(
      <CategoryCard
        categoryId="food"
        itemCount={5}
        status="warning"
        completionPercentage={50}
        totalActualCalories={6000}
        totalNeededCalories={12000}
        missingCalories={6000}
      />,
    );

    // Should show calories in kcal format (divided by 1000)
    expect(screen.getByText('6 / 12 kcal')).toBeInTheDocument();
  });

  it('renders missing calories message for food category', () => {
    render(
      <CategoryCard
        categoryId="food"
        itemCount={5}
        status="critical"
        completionPercentage={25}
        totalActualCalories={3000}
        totalNeededCalories={12000}
        missingCalories={9000}
      />,
    );

    // Should show missing calories message
    expect(screen.getByText('Need 9000 kcal more')).toBeInTheDocument();
  });
});
