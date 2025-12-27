import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryCard } from './CategoryCard';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { ns?: string }) => {
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
      };

      if (options?.ns === 'categories') {
        return categoryTranslations[key] || key;
      }
      if (options?.ns === 'units') {
        return unitTranslations[key] || key;
      }
      return commonTranslations[key] || key;
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

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <CategoryCard
        categoryId="water-beverages"
        itemCount={12}
        status="ok"
        completionPercentage={95}
        onClick={onClick}
      />,
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(onClick).toHaveBeenCalled();
  });

  it('has button role when onClick is provided', () => {
    render(
      <CategoryCard
        categoryId="food"
        itemCount={10}
        status="ok"
        completionPercentage={90}
        onClick={() => {}}
      />,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not have button role when onClick is not provided', () => {
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
    const onClick = jest.fn();

    render(
      <CategoryCard
        categoryId="food"
        itemCount={10}
        status="ok"
        completionPercentage={90}
        onClick={onClick}
      />,
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalled();
  });
});
