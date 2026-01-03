import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemForm } from './ItemForm';
import { STANDARD_CATEGORIES } from '@/data/standardCategories';
import { createMockInventoryItem } from '@/shared/utils/test/factories';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ItemForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('should render empty form for new item', () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;

    expect(nameInput).toHaveValue('');
    expect(quantityInput).toHaveValue(null);
    expect(
      screen.getByRole('button', { name: 'common.add' }),
    ).toBeInTheDocument();
  });

  it('should render form with item data for editing', () => {
    const item = createMockInventoryItem({
      id: '1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 20,
      unit: 'liters',
      recommendedQuantity: 28,
      neverExpires: false,
      expirationDate: '2025-12-31',
      location: 'Pantry',
      notes: 'Test notes',
    });

    render(
      <ItemForm
        item={item}
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;
    const locationInput = document.querySelector(
      '#location',
    ) as HTMLInputElement;
    const notesTextarea = document.querySelector(
      '#notes',
    ) as HTMLTextAreaElement;

    expect(nameInput).toHaveValue('Water');
    expect(quantityInput).toHaveValue(20);
    expect(locationInput).toHaveValue('Pantry');
    expect(notesTextarea).toHaveValue('Test notes');
    expect(
      screen.getByRole('button', { name: 'common.save' }),
    ).toBeInTheDocument();
  });

  it('should validate required fields', () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'common.add' });
    fireEvent.click(submitButton);

    // Validation should prevent submission
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate quantity fields', () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(categorySelect, { target: { value: 'water-beverages' } });
    fireEvent.change(quantityInput, { target: { value: '-5' } });

    const submitButton = screen.getByRole('button', { name: 'common.add' });
    fireEvent.click(submitButton);

    // Validation should prevent submission due to negative values
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should require expiration date when not never expires', () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={20}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(categorySelect, { target: { value: 'water-beverages' } });
    fireEvent.change(quantityInput, { target: { value: '10' } });

    const submitButton = screen.getByRole('button', { name: 'common.add' });
    fireEvent.click(submitButton);

    // Validation should prevent submission without expiration date
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid form data', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={20}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;
    const expirationDateInput = document.querySelector(
      '#expirationDate',
    ) as HTMLInputElement;
    const locationInput = document.querySelector(
      '#location',
    ) as HTMLInputElement;
    const notesTextarea = document.querySelector(
      '#notes',
    ) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(categorySelect, { target: { value: 'water-beverages' } });
    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.change(expirationDateInput, { target: { value: '2025-12-31' } });
    fireEvent.change(locationInput, { target: { value: 'Pantry' } });
    fireEvent.change(notesTextarea, { target: { value: 'Test notes' } });

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Item',
        itemType: 'custom',
        categoryId: 'water-beverages',
        quantity: 10,
        unit: 'pieces',
        recommendedQuantity: 20,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: 'Pantry',
        notes: 'Test notes',
        weightGrams: undefined,
        caloriesPerUnit: undefined,
        capacityMah: undefined,
        capacityWh: undefined,
      });
    });
  });

  it('should hide expiration date field when never expires is checked', () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    // Initially, expiration date should be visible
    expect(document.querySelector('#expirationDate')).toBeInTheDocument();

    // Find and check the never expires checkbox
    const neverExpiresCheckbox = screen.getByRole('checkbox');
    fireEvent.click(neverExpiresCheckbox);

    // Expiration date should be hidden
    expect(document.querySelector('#expirationDate')).not.toBeInTheDocument();
  });

  it('should submit with neverExpires and no expiration date', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={20}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;
    const neverExpiresCheckbox = screen.getByRole('checkbox');

    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(categorySelect, { target: { value: 'water-beverages' } });
    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.click(neverExpiresCheckbox);

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Item',
        itemType: 'custom',
        categoryId: 'water-beverages',
        quantity: 10,
        unit: 'pieces',
        recommendedQuantity: 20,
        neverExpires: true,
        expirationDate: undefined,
        location: undefined,
        notes: undefined,
        weightGrams: undefined,
        caloriesPerUnit: undefined,
        capacityMah: undefined,
        capacityWh: undefined,
      });
    });
  });

  it('should call onCancel when cancel button is clicked (editing existing item)', () => {
    const existingItem = createMockInventoryItem({
      id: '1',
      name: 'Test Item',
      categoryId: 'food',
      quantity: 5,
      unit: 'pieces',
      recommendedQuantity: 10,
      neverExpires: false,
      expirationDate: '2025-12-31',
    });

    render(
      <ItemForm
        item={existingItem}
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should allow submission after fixing validation errors', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={20}
      />,
    );

    // Submit to trigger validation
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Fill in valid data using input IDs
    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;
    const expirationDateInput = document.querySelector(
      '#expirationDate',
    ) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(categorySelect, { target: { value: 'water-beverages' } });
    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.change(expirationDateInput, { target: { value: '2025-12-31' } });

    // Submit again
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should not change weight and calories when quantity changes', async () => {
    // Render form for food category with template values
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
        templateWeightGramsPerUnit={400}
        templateCaloriesPer100g={50}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;

    // Select food category to show weight/calorie fields
    fireEvent.change(nameInput, { target: { value: 'Test Food' } });
    fireEvent.change(categorySelect, { target: { value: 'food' } });

    const weightInput = document.querySelector(
      '#weightGrams',
    ) as HTMLInputElement;
    const caloriesInput = document.querySelector(
      '#caloriesPerUnit',
    ) as HTMLInputElement;

    // Weight and calories should be initialized from template
    expect(weightInput).toHaveValue(400);
    expect(caloriesInput).toHaveValue(200); // 400g * 50kcal/100g = 200kcal

    // Change quantity
    fireEvent.change(quantityInput, { target: { value: '5' } });

    // Weight and calories should NOT change (they are per-unit values)
    expect(weightInput).toHaveValue(400);
    expect(caloriesInput).toHaveValue(200);

    // Change quantity again
    fireEvent.change(quantityInput, { target: { value: '10' } });

    // Still should not change
    expect(weightInput).toHaveValue(400);
    expect(caloriesInput).toHaveValue(200);
  });

  it('should recalculate calories when weight is manually changed', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
        templateWeightGramsPerUnit={400}
        templateCaloriesPer100g={50}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;

    // Select food category to show weight/calorie fields
    fireEvent.change(nameInput, { target: { value: 'Test Food' } });
    fireEvent.change(categorySelect, { target: { value: 'food' } });

    const weightInput = document.querySelector(
      '#weightGrams',
    ) as HTMLInputElement;
    const caloriesInput = document.querySelector(
      '#caloriesPerUnit',
    ) as HTMLInputElement;

    // Initial values
    expect(weightInput).toHaveValue(400);
    expect(caloriesInput).toHaveValue(200);

    // Manually change weight to 200g
    fireEvent.change(weightInput, { target: { value: '200' } });

    // Calories should be recalculated: 200g * 50kcal/100g = 100kcal
    expect(caloriesInput).toHaveValue(100);
  });

  it('should show capacity fields for light-power category', () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={1}
      />,
    );

    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;

    // Initially no capacity fields visible
    expect(document.querySelector('#capacityMah')).not.toBeInTheDocument();
    expect(document.querySelector('#capacityWh')).not.toBeInTheDocument();

    // Select light-power category
    fireEvent.change(categorySelect, { target: { value: 'light-power' } });

    // Capacity fields should now be visible
    expect(document.querySelector('#capacityMah')).toBeInTheDocument();
    expect(document.querySelector('#capacityWh')).toBeInTheDocument();
  });

  it('should not show capacity fields for non-power categories', () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={1}
      />,
    );

    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;

    // Select water category
    fireEvent.change(categorySelect, { target: { value: 'water-beverages' } });

    // Capacity fields should not be visible
    expect(document.querySelector('#capacityMah')).not.toBeInTheDocument();
    expect(document.querySelector('#capacityWh')).not.toBeInTheDocument();
  });

  it('should submit capacity values for power items', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={1}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;
    const neverExpiresCheckbox = screen.getByRole('checkbox');

    fireEvent.change(nameInput, { target: { value: 'Power Bank' } });
    fireEvent.change(categorySelect, { target: { value: 'light-power' } });
    fireEvent.change(quantityInput, { target: { value: '1' } });
    fireEvent.click(neverExpiresCheckbox);

    // Fill in capacity fields
    const capacityMahInput = document.querySelector(
      '#capacityMah',
    ) as HTMLInputElement;
    const capacityWhInput = document.querySelector(
      '#capacityWh',
    ) as HTMLInputElement;

    fireEvent.change(capacityMahInput, { target: { value: '10000' } });
    fireEvent.change(capacityWhInput, { target: { value: '37' } });

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Power Bank',
          categoryId: 'light-power',
          capacityMah: 10000,
          capacityWh: 37,
        }),
      );
    });
  });

  it('should load existing capacity values when editing', () => {
    const powerItem = createMockInventoryItem({
      id: '1',
      name: 'Power Bank',
      categoryId: 'light-power',
      quantity: 1,
      unit: 'pieces',
      neverExpires: true,
      capacityMah: 20000,
      capacityWh: 74,
    });

    render(
      <ItemForm
        item={powerItem}
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const capacityMahInput = document.querySelector(
      '#capacityMah',
    ) as HTMLInputElement;
    const capacityWhInput = document.querySelector(
      '#capacityWh',
    ) as HTMLInputElement;

    expect(capacityMahInput).toHaveValue(20000);
    expect(capacityWhInput).toHaveValue(74);
  });

  it('should submit undefined capacity when fields are empty', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={1}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;
    const neverExpiresCheckbox = screen.getByRole('checkbox');

    fireEvent.change(nameInput, { target: { value: 'Flashlight' } });
    fireEvent.change(categorySelect, { target: { value: 'light-power' } });
    fireEvent.change(quantityInput, { target: { value: '2' } });
    fireEvent.click(neverExpiresCheckbox);

    // Don't fill in capacity fields

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Flashlight',
          categoryId: 'light-power',
          capacityMah: undefined,
          capacityWh: undefined,
        }),
      );
    });
  });

  it('should show water requirement field for food category', () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
        templateRequiresWaterLiters={0.5}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;

    // Select food category to show water requirement field
    fireEvent.change(nameInput, { target: { value: 'Instant Noodles' } });
    fireEvent.change(categorySelect, { target: { value: 'food' } });

    const waterRequirementInput = document.querySelector(
      '#requiresWaterLiters',
    ) as HTMLInputElement;
    expect(waterRequirementInput).toBeInTheDocument();
    expect(waterRequirementInput).toHaveValue(0.5);
  });

  it('should update caloriesPerUnit field manually', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;

    fireEvent.change(nameInput, { target: { value: 'Test Food' } });
    fireEvent.change(categorySelect, { target: { value: 'food' } });

    const caloriesInput = document.querySelector(
      '#caloriesPerUnit',
    ) as HTMLInputElement;
    fireEvent.change(caloriesInput, { target: { value: '250' } });
    expect(caloriesInput).toHaveValue(250);
  });

  it('should update requiresWaterLiters field manually', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;

    fireEvent.change(nameInput, { target: { value: 'Test Food' } });
    fireEvent.change(categorySelect, { target: { value: 'food' } });

    const waterRequirementInput = document.querySelector(
      '#requiresWaterLiters',
    ) as HTMLInputElement;
    fireEvent.change(waterRequirementInput, { target: { value: '0.75' } });
    expect(waterRequirementInput).toHaveValue(0.75);
  });

  it('should use continuous unit step for decimal quantities', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
      />,
    );

    const unitSelect = document.querySelector('#unit') as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;

    // Change to liters (continuous unit)
    fireEvent.change(unitSelect, { target: { value: 'liters' } });

    // Quantity input should allow decimal step (0.1)
    expect(quantityInput).toHaveAttribute('step', '0.1');
  });

  it('should use discrete unit step for integer quantities', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
      />,
    );

    const unitSelect = document.querySelector('#unit') as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;

    // Default is pieces (discrete unit)
    expect(quantityInput).toHaveAttribute('step', '1');

    // Change to cans (also discrete)
    fireEvent.change(unitSelect, { target: { value: 'cans' } });
    expect(quantityInput).toHaveAttribute('step', '1');
  });

  it('should submit food item with water requirement', async () => {
    render(
      <ItemForm
        categories={STANDARD_CATEGORIES}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultRecommendedQuantity={10}
      />,
    );

    const nameInput = document.querySelector('#name') as HTMLInputElement;
    const categorySelect = document.querySelector(
      '#categoryId',
    ) as HTMLSelectElement;
    const quantityInput = document.querySelector(
      '#quantity',
    ) as HTMLInputElement;
    const neverExpiresCheckbox = screen.getByRole('checkbox');

    fireEvent.change(nameInput, { target: { value: 'Instant Noodles' } });
    fireEvent.change(categorySelect, { target: { value: 'food' } });
    fireEvent.change(quantityInput, { target: { value: '5' } });
    fireEvent.click(neverExpiresCheckbox);

    const waterRequirementInput = document.querySelector(
      '#requiresWaterLiters',
    ) as HTMLInputElement;
    fireEvent.change(waterRequirementInput, { target: { value: '0.5' } });

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Instant Noodles',
          categoryId: 'food',
          requiresWaterLiters: 0.5,
        }),
      );
    });
  });
});
