import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CategoryStatusSummary,
  CategoryShortage,
} from './CategoryStatusSummary';

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
        'inventory.recommended': 'Recommended',
        'inventory.showLess': 'Show less',
        'inventory.showRecommended': 'Show {{count}} recommended items',
      };

      const productTranslations: Record<string, string> = {
        bandages: 'Bandages',
        'pain-relievers': 'Pain Relievers',
        antiseptic: 'Antiseptic',
        'first-aid-kit': 'First Aid Kit',
        thermometer: 'Thermometer',
        'prescription-meds': 'Prescription Medications',
      };

      if (options?.ns === 'categories') {
        return categoryTranslations[key] || key;
      }
      if (options?.ns === 'units') {
        return unitTranslations[key] || key;
      }
      if (options?.ns === 'products') {
        return productTranslations[key] || key;
      }

      // Handle interpolation for translations with {{count}}
      if (key === 'inventory.showRecommended' && options?.count) {
        return `Show ${options.count} recommended items`;
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

  describe('missing items list', () => {
    const createShortages = (count: number): CategoryShortage[] => {
      const items = [
        { id: 'bandages', name: 'bandages', missing: 20 },
        { id: 'pain-relievers', name: 'pain-relievers', missing: 10 },
        { id: 'antiseptic', name: 'antiseptic', missing: 5 },
        { id: 'first-aid-kit', name: 'first-aid-kit', missing: 1 },
        { id: 'thermometer', name: 'thermometer', missing: 2 },
        { id: 'prescription-meds', name: 'prescription-meds', missing: 45 },
      ];

      return items.slice(0, count).map((item) => ({
        itemId: item.id,
        itemName: `products.${item.name}`,
        actual: 0,
        needed: item.missing,
        unit: 'pieces' as const,
        missing: item.missing,
      }));
    };

    it('hides missing items by default and shows expand button', () => {
      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="critical"
          completionPercentage={0}
          totalActual={0}
          totalNeeded={35}
          primaryUnit="pieces"
          shortages={createShortages(2)}
        />,
      );

      expect(screen.getByText('Recommended:')).toBeInTheDocument();
      // Items should be hidden by default
      expect(screen.queryByText('20 pcs Bandages')).not.toBeInTheDocument();
      expect(
        screen.queryByText('10 pcs Pain Relievers'),
      ).not.toBeInTheDocument();
      // Expand button should be visible
      expect(
        screen.getByRole('button', { name: 'Show 2 recommended items' }),
      ).toBeInTheDocument();
    });

    it('does not show missing section when no shortages', () => {
      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="ok"
          completionPercentage={100}
          totalActual={35}
          totalNeeded={35}
          primaryUnit="pieces"
          shortages={[]}
        />,
      );

      expect(screen.queryByText('Recommended:')).not.toBeInTheDocument();
    });

    it('hides all items by default when shortages exist', () => {
      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="critical"
          completionPercentage={0}
          totalActual={0}
          totalNeeded={83}
          primaryUnit="pieces"
          shortages={createShortages(6)}
        />,
      );

      // All items should be hidden by default
      expect(screen.queryByText('20 pcs Bandages')).not.toBeInTheDocument();
      expect(
        screen.queryByText('10 pcs Pain Relievers'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('5 pcs Antiseptic')).not.toBeInTheDocument();
      expect(screen.queryByText('1 pcs First Aid Kit')).not.toBeInTheDocument();
      expect(screen.queryByText('2 pcs Thermometer')).not.toBeInTheDocument();
      expect(
        screen.queryByText('45 pcs Prescription Medications'),
      ).not.toBeInTheDocument();
    });

    it('shows expand button with count when shortages exist', () => {
      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="critical"
          completionPercentage={0}
          totalActual={0}
          totalNeeded={83}
          primaryUnit="pieces"
          shortages={createShortages(6)}
        />,
      );

      // Should show "Show 6 recommended items" button
      expect(
        screen.getByRole('button', { name: 'Show 6 recommended items' }),
      ).toBeInTheDocument();
    });

    it('shows expand button when any shortages exist', () => {
      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="critical"
          completionPercentage={0}
          totalActual={0}
          totalNeeded={35}
          primaryUnit="pieces"
          shortages={createShortages(3)}
        />,
      );

      // Should show expand button even with 3 or fewer items
      expect(
        screen.getByRole('button', { name: 'Show 3 recommended items' }),
      ).toBeInTheDocument();
    });

    it('expands to show all items when expand button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="critical"
          completionPercentage={0}
          totalActual={0}
          totalNeeded={83}
          primaryUnit="pieces"
          shortages={createShortages(6)}
        />,
      );

      // Click expand button
      await user.click(
        screen.getByRole('button', { name: 'Show 6 recommended items' }),
      );

      // All items should now be visible
      expect(screen.getByText('20 pcs Bandages')).toBeInTheDocument();
      expect(screen.getByText('10 pcs Pain Relievers')).toBeInTheDocument();
      expect(screen.getByText('5 pcs Antiseptic')).toBeInTheDocument();
      expect(screen.getByText('1 pcs First Aid Kit')).toBeInTheDocument();
      expect(screen.getByText('2 pcs Thermometer')).toBeInTheDocument();
      expect(
        screen.getByText('45 pcs Prescription Medications'),
      ).toBeInTheDocument();

      // Button should now show "Show less"
      expect(
        screen.getByRole('button', { name: 'Show less' }),
      ).toBeInTheDocument();
    });

    it('collapses back to hiding all items when show less is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="critical"
          completionPercentage={0}
          totalActual={0}
          totalNeeded={83}
          primaryUnit="pieces"
          shortages={createShortages(6)}
        />,
      );

      // Expand
      await user.click(
        screen.getByRole('button', { name: 'Show 6 recommended items' }),
      );

      // Collapse
      await user.click(screen.getByRole('button', { name: 'Show less' }));

      // All items should be hidden again
      expect(screen.queryByText('20 pcs Bandages')).not.toBeInTheDocument();
      expect(
        screen.queryByText('10 pcs Pain Relievers'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('5 pcs Antiseptic')).not.toBeInTheDocument();
      expect(screen.queryByText('1 pcs First Aid Kit')).not.toBeInTheDocument();
      expect(screen.queryByText('2 pcs Thermometer')).not.toBeInTheDocument();
      expect(
        screen.queryByText('45 pcs Prescription Medications'),
      ).not.toBeInTheDocument();

      // Button should show "Show 6 recommended items" again
      expect(
        screen.getByRole('button', { name: 'Show 6 recommended items' }),
      ).toBeInTheDocument();
    });

    it('calls onAddToInventory when add button is clicked', async () => {
      const user = userEvent.setup();
      const onAddToInventory = jest.fn();

      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="critical"
          completionPercentage={0}
          totalActual={0}
          totalNeeded={35}
          primaryUnit="pieces"
          shortages={createShortages(2)}
          onAddToInventory={onAddToInventory}
        />,
      );

      // First expand the recommended items (they are hidden by default)
      const expandButton = screen.getByRole('button', {
        name: /Show.*recommended/i,
      });
      await user.click(expandButton);

      // Click the first add button (+)
      const addButtons = screen.getAllByRole('button', {
        name: 'inventory.addToInventory',
      });
      await user.click(addButtons[0]);

      expect(onAddToInventory).toHaveBeenCalledWith('bandages');
    });

    it('calls onDisableRecommended when disable button is clicked', async () => {
      const user = userEvent.setup();
      const onDisableRecommended = jest.fn();

      render(
        <CategoryStatusSummary
          categoryId="medical-health"
          status="critical"
          completionPercentage={0}
          totalActual={0}
          totalNeeded={35}
          primaryUnit="pieces"
          shortages={createShortages(2)}
          onDisableRecommended={onDisableRecommended}
        />,
      );

      // First expand the recommended items (they are hidden by default)
      const expandButton = screen.getByRole('button', {
        name: /Show.*recommended/i,
      });
      await user.click(expandButton);

      // Click the first disable button (×)
      const disableButtons = screen.getAllByRole('button', {
        name: 'inventory.disableRecommended',
      });
      await user.click(disableButtons[0]);

      expect(onDisableRecommended).toHaveBeenCalledWith('bandages');
    });

    it('shows item count text when primaryUnit is null and totalNeeded > 0', () => {
      render(
        <CategoryStatusSummary
          categoryId="water-beverages"
          status="warning"
          completionPercentage={50}
          totalActual={5}
          totalNeeded={10}
          primaryUnit={null}
        />,
      );

      expect(
        screen.getByText('5 / 10 dashboard.category.items'),
      ).toBeInTheDocument();
    });
  });

  describe('missing calories display', () => {
    it('displays missing calories message for food category', () => {
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
          missingCalories={6000}
        />,
      );

      expect(
        screen.getByText('dashboard.category.recommendedCalories'),
      ).toBeInTheDocument();
    });

    it('does not display missing calories when missingCalories is 0', () => {
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
          missingCalories={0}
        />,
      );

      expect(screen.queryByText(/recommendedCalories/)).not.toBeInTheDocument();
    });
  });
});
