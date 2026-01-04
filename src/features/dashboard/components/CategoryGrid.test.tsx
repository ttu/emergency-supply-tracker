import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { CategoryGrid } from './CategoryGrid';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { ns?: string }) => {
      const categoryTranslations: Record<string, string> = {
        'water-beverages': 'Water & Beverages',
        food: 'Food',
        'medical-health': 'Medical',
      };

      const commonTranslations: Record<string, string> = {
        'status.ok': 'OK',
        'dashboard.category.items': 'Items',
        'dashboard.category.completion': 'Completion',
      };

      if (options?.ns === 'categories') {
        return categoryTranslations[key] || key;
      }
      return commonTranslations[key] || key;
    },
  }),
}));

describe('CategoryGrid', () => {
  it('renders empty grid when no categories provided', () => {
    const { container } = render(<CategoryGrid categories={[]} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it('renders all category cards', () => {
    render(
      <CategoryGrid
        categories={[
          {
            categoryId: 'water-beverages',
            itemCount: 12,
            status: 'ok',
            completionPercentage: 95,
          },
          {
            categoryId: 'food',
            itemCount: 18,
            status: 'ok',
            completionPercentage: 85,
          },
        ]}
      />,
    );

    expect(screen.getByText('Water & Beverages')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('renders multiple categories with different statuses', () => {
    render(
      <CategoryGrid
        categories={[
          {
            categoryId: 'water-beverages',
            itemCount: 5,
            status: 'critical',
            completionPercentage: 20,
          },
          {
            categoryId: 'food',
            itemCount: 10,
            status: 'warning',
            completionPercentage: 50,
          },
          {
            categoryId: 'medical-health',
            itemCount: 15,
            status: 'ok',
            completionPercentage: 95,
          },
        ]}
      />,
    );

    expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
  });
});
