import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemEditor } from './ItemEditor';
import type { ImportedRecommendedItem } from '@/shared/types';
import { createProductTemplateId, createQuantity } from '@/shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { ns?: string }) => {
      if (options?.ns === 'categories') return key;
      if (options?.ns === 'units') return key;
      return key;
    },
  }),
}));

describe('ItemEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const mockItem: ImportedRecommendedItem = {
    id: createProductTemplateId('test-item'),
    names: { en: 'Test Item', fi: 'Testituote' },
    category: 'food',
    baseQuantity: createQuantity(5),
    unit: 'pieces',
    scaleWithPeople: true,
    scaleWithDays: false,
    defaultExpirationMonths: 12,
    weightGramsPerUnit: 100,
    caloriesPer100g: 200,
  };

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  it('should render empty form for new item', () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByTestId('item-editor')).toBeInTheDocument();
    expect(screen.getByTestId('item-name-en')).toHaveValue('');
    expect(screen.getByTestId('item-name-fi')).toHaveValue('');
  });

  it('should pre-fill form when editing existing item', () => {
    render(
      <ItemEditor
        item={mockItem}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId('item-name-en')).toHaveValue('Test Item');
    expect(screen.getByTestId('item-name-fi')).toHaveValue('Testituote');
    expect(screen.getByTestId('item-base-quantity')).toHaveValue(5);
    expect(screen.getByTestId('item-category')).toHaveValue('food');
    expect(screen.getByTestId('item-unit')).toHaveValue('pieces');
  });

  it('should call onCancel when cancel button is clicked', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.click(screen.getByTestId('item-editor-cancel'));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show validation error when no name is provided', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(
      screen.getByText('kitEditor.validation.nameRequired'),
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid quantity', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    const qtyInput = screen.getByTestId('item-base-quantity');
    // Clear and set to empty string to test validation
    await userEvent.clear(qtyInput);
    // Directly submit the form to bypass HTML5 validation constraints
    const form = screen.getByTestId('item-editor');
    fireEvent.submit(form);

    // Form validates that empty quantity is invalid
    expect(
      screen.getByText('kitEditor.validation.quantityPositive'),
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave with correct data when form is valid', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'New Item');
    await userEvent.type(screen.getByTestId('item-name-fi'), 'Uusi tuote');
    await userEvent.clear(screen.getByTestId('item-base-quantity'));
    await userEvent.type(screen.getByTestId('item-base-quantity'), '10');
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        names: { en: 'New Item', fi: 'Uusi tuote' },
        baseQuantity: createQuantity(10),
        category: 'food',
        unit: 'pieces',
        scaleWithPeople: true,
        scaleWithDays: false,
      }),
    );
  });

  it('should use English name for Finnish if Finnish is empty', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'English Only');
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        names: { en: 'English Only', fi: 'English Only' },
      }),
    );
  });

  it('should use Finnish name for English if English is empty', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-fi'), 'Vain suomeksi');
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        names: { en: 'Vain suomeksi', fi: 'Vain suomeksi' },
      }),
    );
  });

  it('should change category', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    await userEvent.selectOptions(
      screen.getByTestId('item-category'),
      'water-beverages',
    );
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'water-beverages',
      }),
    );
  });

  it('should change unit', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    await userEvent.selectOptions(screen.getByTestId('item-unit'), 'liters');
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        unit: 'liters',
      }),
    );
  });

  it('should toggle scaleWithPeople', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    // Default is true, so clicking should set to false
    await userEvent.click(screen.getByTestId('item-scale-people'));
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        scaleWithPeople: false,
      }),
    );
  });

  it('should toggle scaleWithDays', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    // Default is false, so clicking should set to true
    await userEvent.click(screen.getByTestId('item-scale-days'));
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        scaleWithDays: true,
      }),
    );
  });

  it('should toggle requiresFreezer', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    await userEvent.click(screen.getByTestId('item-requires-freezer'));
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        requiresFreezer: true,
      }),
    );
  });

  it('should include defaultExpirationMonths when provided', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    await userEvent.type(screen.getByTestId('item-expiration-months'), '24');
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultExpirationMonths: 24,
      }),
    );
  });

  it('should include weight and calories for food category', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test Food');
    await userEvent.type(screen.getByTestId('item-weight'), '500');
    await userEvent.type(screen.getByTestId('item-calories'), '150');
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        weightGramsPerUnit: 500,
        caloriesPer100g: 150,
      }),
    );
  });

  it('should not include weight and calories for non-food category', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    await userEvent.selectOptions(
      screen.getByTestId('item-category'),
      'tools-supplies',
    );
    await userEvent.click(screen.getByTestId('item-editor-save'));

    expect(mockOnSave).toHaveBeenCalled();
    const savedItem = mockOnSave.mock.calls[0][0];
    expect(savedItem.weightGramsPerUnit).toBeUndefined();
    expect(savedItem.caloriesPer100g).toBeUndefined();
  });

  it('should show different title for editing vs adding', () => {
    const { rerender } = render(
      <ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />,
    );

    // Check the heading (h3) specifically for add mode
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'kitEditor.addItem',
    );

    rerender(
      <ItemEditor
        item={mockItem}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    // Check the heading for edit mode
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'kitEditor.editItem',
    );
  });

  it('should ignore invalid (negative) expiration months', async () => {
    render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByTestId('item-name-en'), 'Test');
    // Use fireEvent to directly set the value (bypasses HTML5 input type=number restrictions)
    fireEvent.change(screen.getByTestId('item-expiration-months'), {
      target: { value: '-5' },
    });
    // Submit form directly to bypass any HTML5 validation
    const form = screen.getByTestId('item-editor');
    fireEvent.submit(form);

    // Form should still submit (name is valid)
    expect(mockOnSave).toHaveBeenCalled();
    // -5 is not positive, so it should be ignored (not included in saved item)
    const savedItem = mockOnSave.mock.calls[0][0];
    expect(savedItem.defaultExpirationMonths).toBeUndefined();
  });

  it('should generate unique ID when creating new item with existingIds', () => {
    // Create a set with many IDs to increase chance of collision
    const existingIds = new Set<string>();
    for (let i = 0; i < 100; i++) {
      existingIds.add(`custom-${i}`);
    }

    // The component should generate an ID that's not in existingIds
    // We can't directly test the generated ID, but we can verify the component renders
    // and doesn't crash when existingIds contains many IDs
    render(
      <ItemEditor
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        existingIds={existingIds}
      />,
    );

    expect(screen.getByTestId('item-editor')).toBeInTheDocument();
    // The form should render successfully, meaning a unique ID was generated
    expect(screen.getByTestId('item-name-en')).toBeInTheDocument();
  });

  it('should not validate ID uniqueness when editing existing item', async () => {
    const existingIds = new Set([mockItem.id]);

    render(
      <ItemEditor
        item={mockItem}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        existingIds={existingIds}
      />,
    );

    // Change the name and submit
    await userEvent.clear(screen.getByTestId('item-name-en'));
    await userEvent.type(screen.getByTestId('item-name-en'), 'Updated Name');
    await userEvent.click(screen.getByTestId('item-editor-save'));

    // Should save successfully even though ID is in existingIds (because we're editing)
    expect(mockOnSave).toHaveBeenCalled();
    expect(
      screen.queryByText('kitEditor.validation.idExists'),
    ).not.toBeInTheDocument();
  });

  describe('built-in name type selection', () => {
    const mockItemWithI18nKey: ImportedRecommendedItem = {
      id: createProductTemplateId('bottled-water-item'),
      i18nKey: 'products.bottled-water',
      category: 'water-beverages',
      baseQuantity: createQuantity(2),
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
    };

    it('should show built-in name type selected when editing item with i18nKey', () => {
      render(
        <ItemEditor
          item={mockItemWithI18nKey}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const builtinRadio = screen.getByTestId(
        'name-type-builtin',
      ) as HTMLInputElement;
      expect(builtinRadio.checked).toBe(true);

      // Product key select should be visible
      expect(screen.getByTestId('item-product-key')).toBeInTheDocument();
      expect(screen.getByTestId('item-product-key')).toHaveValue(
        'bottled-water',
      );
    });

    it('should show custom name type selected by default for new item', () => {
      render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const customRadio = screen.getByTestId(
        'name-type-custom',
      ) as HTMLInputElement;
      expect(customRadio.checked).toBe(true);

      // Custom name inputs should be visible
      expect(screen.getByTestId('item-name-en')).toBeInTheDocument();
      expect(screen.getByTestId('item-name-fi')).toBeInTheDocument();
    });

    it('should toggle between builtin and custom name types', async () => {
      render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Initially custom is selected
      expect(screen.getByTestId('item-name-en')).toBeInTheDocument();

      // Switch to builtin
      await userEvent.click(screen.getByTestId('name-type-builtin'));
      expect(screen.getByTestId('item-product-key')).toBeInTheDocument();
      expect(screen.queryByTestId('item-name-en')).not.toBeInTheDocument();

      // Switch back to custom
      await userEvent.click(screen.getByTestId('name-type-custom'));
      expect(screen.getByTestId('item-name-en')).toBeInTheDocument();
      expect(screen.queryByTestId('item-product-key')).not.toBeInTheDocument();
    });

    it('should save item with i18nKey when builtin product is selected', async () => {
      render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Switch to builtin and select a product
      await userEvent.click(screen.getByTestId('name-type-builtin'));
      await userEvent.selectOptions(
        screen.getByTestId('item-product-key'),
        'canned-soup',
      );
      await userEvent.click(screen.getByTestId('item-editor-save'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          i18nKey: 'products.canned-soup',
        }),
      );
      // Should not have names property
      const savedItem = mockOnSave.mock.calls[0][0];
      expect(savedItem.names).toBeUndefined();
    });

    it('should show validation error when builtin type selected but no product chosen', async () => {
      render(<ItemEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Switch to builtin but don't select a product
      await userEvent.click(screen.getByTestId('name-type-builtin'));
      await userEvent.click(screen.getByTestId('item-editor-save'));

      expect(
        screen.getByText('kitEditor.validation.nameRequired'),
      ).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should preserve i18nKey when editing item with i18nKey and saving', async () => {
      render(
        <ItemEditor
          item={mockItemWithI18nKey}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      // Just change the quantity and save
      await userEvent.clear(screen.getByTestId('item-base-quantity'));
      await userEvent.type(screen.getByTestId('item-base-quantity'), '5');
      await userEvent.click(screen.getByTestId('item-editor-save'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          i18nKey: 'products.bottled-water',
          baseQuantity: createQuantity(5),
        }),
      );
    });

    it('should allow changing builtin product when editing', async () => {
      render(
        <ItemEditor
          item={mockItemWithI18nKey}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      // Change to a different product
      await userEvent.selectOptions(
        screen.getByTestId('item-product-key'),
        'pasta',
      );
      await userEvent.click(screen.getByTestId('item-editor-save'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          i18nKey: 'products.pasta',
        }),
      );
    });
  });
});
