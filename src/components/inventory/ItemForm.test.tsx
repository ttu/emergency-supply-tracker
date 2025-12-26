import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemForm } from './ItemForm';
import { STANDARD_CATEGORIES } from '../../data/standardCategories';
import type { InventoryItem } from '../../types';

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
    expect(screen.getByText(/10/)).toBeInTheDocument(); // Recommended quantity display
    expect(
      screen.getByRole('button', { name: 'common.add' }),
    ).toBeInTheDocument();
  });

  it('should render form with item data for editing', () => {
    const now = new Date().toISOString();
    const item: InventoryItem = {
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
      createdAt: now,
      updatedAt: now,
    };

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
    expect(screen.getByText(/28/)).toBeInTheDocument(); // Recommended quantity display
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
        categoryId: 'water-beverages',
        quantity: 10,
        unit: 'pieces',
        recommendedQuantity: 20,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: 'Pantry',
        notes: 'Test notes',
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
        categoryId: 'water-beverages',
        quantity: 10,
        unit: 'pieces',
        recommendedQuantity: 20,
        neverExpires: true,
        expirationDate: undefined,
        location: undefined,
        notes: undefined,
      });
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <ItemForm
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
});
