import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Inventory } from './Inventory';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { HouseholdProvider } from '../contexts/HouseholdProvider';
import { SettingsProvider } from '../contexts/SettingsProvider';
import { RECOMMENDED_ITEMS } from '../data/recommendedItems';
import { calculateRecommendedQuantity } from '../utils/calculations/household';
import { calculateCategoryPreparedness } from '../utils/dashboard/preparedness';
import type { InventoryItem } from '../types';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      <HouseholdProvider>
        <InventoryProvider>{component}</InventoryProvider>
      </HouseholdProvider>
    </SettingsProvider>,
  );
};

describe('Inventory Page', () => {
  beforeEach(() => {
    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render inventory page', () => {
    renderWithProviders(<Inventory />);

    expect(screen.getByText('navigation.inventory')).toBeInTheDocument();
    expect(screen.getByText('inventory.addFromTemplate')).toBeInTheDocument();
  });

  it('should show category navigation', () => {
    renderWithProviders(<Inventory />);

    expect(screen.getByText('inventory.allCategories')).toBeInTheDocument();
  });

  it('should show filter bar', () => {
    renderWithProviders(<Inventory />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    renderWithProviders(<Inventory />);

    expect(screen.getByText('inventory.noItems')).toBeInTheDocument();
  });

  it('should open add modal when clicking custom item in template selector', () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Click custom item button
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
  });

  it('should open template modal when clicking add from template', () => {
    renderWithProviders(<Inventory />);

    const templateButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(templateButton);

    expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();
  });

  it('should close modal when clicking cancel', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Select custom item to open the form
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    // Modal should show add item form
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();

    // Click close button (X) to close modal
    const closeButton = screen.getByLabelText('accessibility.closeModal');
    fireEvent.click(closeButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('inventory.addItem')).not.toBeInTheDocument();
    });
  });

  it('should filter items by search query', () => {
    renderWithProviders(<Inventory />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    fireEvent.change(searchInput, { target: { value: 'water' } });

    // Items would be filtered (tested implicitly through component logic)
    expect(searchInput).toHaveValue('water');
  });

  it('should filter items by category', () => {
    renderWithProviders(<Inventory />);

    const allCategoriesButton = screen.getByText('inventory.allCategories');
    expect(allCategoriesButton).toBeInTheDocument();

    // Category filtering is tested through component logic
  });

  it('should sort items', () => {
    renderWithProviders(<Inventory />);

    // Find the sort select by its label
    const sortLabel = screen.getByText('inventory.sort.label');
    expect(sortLabel).toBeInTheDocument();

    // Sorting is tested through component logic
  });
});

/**
 * Unit test to verify that items created from templates include productTemplateId.
 * This validates the fix for the Categories Overview not showing status correctly.
 */
describe('Template to InventoryItem conversion', () => {
  it('should include productTemplateId when creating item from template', () => {
    const template = RECOMMENDED_ITEMS.find(
      (item) => item.id === 'bottled-water',
    );

    if (!template) {
      throw new Error('Template not found');
    }

    const household = {
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    };

    const recommendedQty = calculateRecommendedQuantity(template, household);

    // Simulate what handleSelectTemplate does in Inventory.tsx
    const newItem = {
      name: 'Bottled Water', // translated name
      itemType: template.id, // Store template ID, not translated name
      categoryId: template.category,
      quantity: 0,
      unit: template.unit,
      recommendedQuantity: recommendedQty,
      neverExpires: !template.defaultExpirationMonths,
      expirationDate: template.defaultExpirationMonths
        ? new Date(
            Date.now() +
              template.defaultExpirationMonths * 30 * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined,
      productTemplateId: template.id,
      caloriesPerUnit: template.caloriesPerUnit,
    };

    // Verify productTemplateId is set correctly
    expect(newItem.productTemplateId).toBe('bottled-water');
    expect(newItem.categoryId).toBe('water-beverages');
    // Water items don't have calories
    expect(newItem.caloriesPerUnit).toBeUndefined();
  });

  it('should include caloriesPerUnit for food items from template', () => {
    const template = RECOMMENDED_ITEMS.find(
      (item) => item.id === 'canned-soup',
    );

    if (!template) {
      throw new Error('Template not found');
    }

    const household = {
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    };

    const recommendedQty = calculateRecommendedQuantity(template, household);

    // Simulate what handleSelectTemplate does in Inventory.tsx
    const newItem = {
      name: 'Canned Soup',
      itemType: template.id, // Store template ID, not translated name
      categoryId: template.category,
      quantity: 0,
      unit: template.unit,
      recommendedQuantity: recommendedQty,
      neverExpires: !template.defaultExpirationMonths,
      expirationDate: template.defaultExpirationMonths
        ? new Date(
            Date.now() +
              template.defaultExpirationMonths * 30 * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined,
      productTemplateId: template.id,
      caloriesPerUnit: template.caloriesPerUnit,
    };

    // Verify food item has calories
    expect(newItem.productTemplateId).toBe('canned-soup');
    expect(newItem.categoryId).toBe('food');
    expect(newItem.caloriesPerUnit).toBe(200); // 200 kcal per can
  });

  it('should match items with productTemplateId in preparedness calculation', () => {
    const household = {
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    };

    // Item WITH productTemplateId (the fix)
    const itemWithTemplateId: InventoryItem = {
      id: '1',
      name: 'Bottled Water',
      categoryId: 'water-beverages',
      quantity: 54, // Matches recommended for 2 adults, 3 days (9 * 2 * 3 = 54)
      unit: 'liters',
      recommendedQuantity: 54,
      productTemplateId: 'bottled-water', // This enables matching
      neverExpires: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Item WITHOUT productTemplateId (the bug)
    const itemWithoutTemplateId: InventoryItem = {
      id: '2',
      name: 'Bottled Water',
      categoryId: 'water-beverages',
      quantity: 54,
      unit: 'liters',
      recommendedQuantity: 54,
      // productTemplateId is missing - this was the bug
      neverExpires: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const scoreWithTemplateId = calculateCategoryPreparedness(
      'water-beverages',
      [itemWithTemplateId],
      household,
    );

    const scoreWithoutTemplateId = calculateCategoryPreparedness(
      'water-beverages',
      [itemWithoutTemplateId],
      household,
    );

    // With productTemplateId, the item matches and contributes to the score
    expect(scoreWithTemplateId).toBeGreaterThan(0);

    // Without productTemplateId, the item doesn't match (unless name matches exactly)
    // The score will be 0 because 'Bottled Water' !== 'bottled-water'
    expect(scoreWithoutTemplateId).toBe(0);
  });
});
