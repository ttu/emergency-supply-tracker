import { render, screen } from '@testing-library/react';
import { CategoryStatusSummary } from './CategoryStatusSummary';

// Mock react-i18next
jest.mock('react-i18next', () => ({
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
        'dashboard.category.kcal': 'kcal',
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

describe('CategoryStatusSummary', () => {
  it('renders category name', () => {
    render(
      <CategoryStatusSummary
        categoryId="water-beverages"
        status="ok"
        completionPercentage={95}
        totalActual={54}
        totalNeeded={56}
        primaryUnit="liters"
      />,
    );

    expect(screen.getByText('Water & Beverages')).toBeInTheDocument();
  });

  it('renders status badge with correct text', () => {
    render(
      <CategoryStatusSummary
        categoryId="water-beverages"
        status="ok"
        completionPercentage={95}
        totalActual={54}
        totalNeeded={56}
        primaryUnit="liters"
      />,
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders warning status badge', () => {
    render(
      <CategoryStatusSummary
        categoryId="water-beverages"
        status="warning"
        completionPercentage={50}
        totalActual={27}
        totalNeeded={54}
        primaryUnit="liters"
      />,
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders critical status badge', () => {
    render(
      <CategoryStatusSummary
        categoryId="water-beverages"
        status="critical"
        completionPercentage={20}
        totalActual={10}
        totalNeeded={54}
        primaryUnit="liters"
      />,
    );

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders quantity progress for non-food categories', () => {
    render(
      <CategoryStatusSummary
        categoryId="water-beverages"
        status="warning"
        completionPercentage={50}
        totalActual={27}
        totalNeeded={54}
        primaryUnit="liters"
      />,
    );

    expect(screen.getByText('27 / 54 L')).toBeInTheDocument();
  });

  it('renders percentage when no primary unit', () => {
    render(
      <CategoryStatusSummary
        categoryId="water-beverages"
        status="ok"
        completionPercentage={75}
        totalActual={0}
        totalNeeded={0}
        primaryUnit={null}
      />,
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders calories for food category', () => {
    render(
      <CategoryStatusSummary
        categoryId="food"
        status="warning"
        completionPercentage={50}
        totalActual={5}
        totalNeeded={10}
        primaryUnit="cans"
        totalActualCalories={6000}
        totalNeededCalories={12000}
      />,
    );

    // Values are already in kcal, should show as-is
    expect(screen.getByText('6000 / 12000 kcal')).toBeInTheDocument();
  });

  it('renders food category name', () => {
    render(
      <CategoryStatusSummary
        categoryId="food"
        status="ok"
        completionPercentage={100}
        totalActual={10}
        totalNeeded={10}
        primaryUnit="cans"
        totalActualCalories={12000}
        totalNeededCalories={12000}
      />,
    );

    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('falls back to percentage for food with zero needed calories', () => {
    render(
      <CategoryStatusSummary
        categoryId="food"
        status="ok"
        completionPercentage={100}
        totalActual={10}
        totalNeeded={10}
        primaryUnit="cans"
        totalActualCalories={0}
        totalNeededCalories={0}
      />,
    );

    // Without calorie data, should show units
    expect(screen.getByText('10 / 10 cans')).toBeInTheDocument();
  });

  it('caps progress bar at 100%', () => {
    const { container } = render(
      <CategoryStatusSummary
        categoryId="water-beverages"
        status="ok"
        completionPercentage={120}
        totalActual={65}
        totalNeeded={54}
        primaryUnit="liters"
      />,
    );

    // Progress bar fill should be capped at 100%
    // Find the inner div inside the progress bar div (second child div)
    const progressBars = container.querySelectorAll('div > div');
    // Find the one with inline style
    const progressFill = Array.from(progressBars).find((el) =>
      el.getAttribute('style')?.includes('width'),
    );
    expect(progressFill).toBeTruthy();
    expect(progressFill!.getAttribute('style')).toContain('width: 100%');
  });
});
