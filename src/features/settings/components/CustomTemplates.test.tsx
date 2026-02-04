import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { CustomTemplates } from './CustomTemplates';
import type { ProductTemplate } from '@/shared/types';
import { createProductTemplateId } from '@/shared/types';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'settings.customTemplates.empty': 'No custom templates',
        'settings.customTemplates.hint':
          "Create templates by checking 'Save as template' when adding custom items.",
        'settings.customTemplates.description': `You have ${options?.count || 0} custom template(s).`,
        'settings.customTemplates.editTitle': 'Edit Template',
        'settings.customTemplates.nameEn': 'Name (English)',
        'settings.customTemplates.nameFi': 'Name (Finnish)',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'itemForm.name': 'Name',
        'itemForm.category': 'Category',
        'itemForm.unit': 'Unit',
        'itemForm.neverExpires': 'Never expires',
        'itemForm.weightGrams': 'Weight per unit (g)',
        'itemForm.caloriesPerUnit': 'Calories per unit',
        'itemForm.requiresWaterLiters': 'Water for preparation (L)',
        'settings.customTemplates.defaultExpirationMonths':
          'Default expiration (months)',
        'settings.customTemplates.caloriesPer100g': 'Calories per 100 g',
        food: 'Food',
        'water-beverages': 'Water & Beverages',
        'medical-health': 'Medical & Health',
        pieces: 'pieces',
        liters: 'liters',
        cans: 'cans',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock the categories
vi.mock('@/features/categories', () => ({
  STANDARD_CATEGORIES: [
    { id: 'food', name: 'Food', icon: '🍽️' },
    { id: 'water-beverages', name: 'Water & Beverages', icon: '💧' },
    { id: 'medical-health', name: 'Medical & Health', icon: '🏥' },
  ],
}));

// Mock the inventory hook
const mockDeleteCustomTemplate = vi.fn();
const mockUpdateCustomTemplate = vi.fn();
const mockCustomTemplates: ProductTemplate[] = [
  {
    id: createProductTemplateId('template-1'),
    name: 'My Custom Item',
    category: 'food',
    defaultUnit: 'pieces',
    isBuiltIn: false,
    isCustom: true,
  },
  {
    id: createProductTemplateId('template-2'),
    name: 'Water Bottle',
    category: 'water-beverages',
    defaultUnit: 'liters',
    isBuiltIn: false,
    isCustom: true,
  },
];

vi.mock('@/features/inventory', () => ({
  useInventory: () => ({
    customTemplates: mockCustomTemplates,
    updateCustomTemplate: mockUpdateCustomTemplate,
    deleteCustomTemplate: mockDeleteCustomTemplate,
  }),
}));

describe('CustomTemplates', () => {
  beforeEach(() => {
    mockDeleteCustomTemplate.mockClear();
    mockUpdateCustomTemplate.mockClear();
  });

  it('should render list of custom templates', () => {
    render(<CustomTemplates />);

    expect(screen.getByText('My Custom Item')).toBeInTheDocument();
    expect(screen.getByText('Water Bottle')).toBeInTheDocument();
  });

  it('should show description with count', () => {
    render(<CustomTemplates />);

    expect(screen.getByText(/You have 2 custom template/)).toBeInTheDocument();
  });

  it('should show category for each template', () => {
    render(<CustomTemplates />);

    expect(screen.getByText(/Food/)).toBeInTheDocument();
    expect(screen.getByText(/Water & Beverages/)).toBeInTheDocument();
  });

  it('should show unit for each template', () => {
    render(<CustomTemplates />);

    expect(screen.getByText('pieces')).toBeInTheDocument();
    expect(screen.getByText('liters')).toBeInTheDocument();
  });

  it('should call deleteCustomTemplate when clicking delete button', () => {
    render(<CustomTemplates />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockDeleteCustomTemplate).toHaveBeenCalledTimes(1);
    expect(mockDeleteCustomTemplate).toHaveBeenCalledWith(
      mockCustomTemplates[0].id,
    );
  });

  it('should have delete buttons with accessible labels', () => {
    render(<CustomTemplates />);

    expect(
      screen.getByRole('button', { name: 'Delete: My Custom Item' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete: Water Bottle' }),
    ).toBeInTheDocument();
  });

  it('should have edit buttons with accessible labels', () => {
    render(<CustomTemplates />);

    expect(
      screen.getByRole('button', { name: 'Edit: My Custom Item' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit: Water Bottle' }),
    ).toBeInTheDocument();
  });

  it('should open edit modal when clicking edit button', () => {
    render(<CustomTemplates />);

    const editButton = screen.getByRole('button', {
      name: 'Edit: My Custom Item',
    });
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Template')).toBeInTheDocument();
    // The form inputs should have the template name for both languages
    const nameEnInput = document.getElementById('edit-template-name-en');
    expect(nameEnInput).toHaveValue('My Custom Item');
    const nameFiInput = document.getElementById('edit-template-name-fi');
    expect(nameFiInput).toHaveValue('My Custom Item');
  });

  it('should close edit modal when clicking cancel', async () => {
    render(<CustomTemplates />);

    const editButton = screen.getByRole('button', {
      name: 'Edit: My Custom Item',
    });
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Template')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Edit Template')).not.toBeInTheDocument();
    });
  });

  it('should call updateCustomTemplate when saving edit', () => {
    render(<CustomTemplates />);

    const editButton = screen.getByRole('button', {
      name: 'Edit: My Custom Item',
    });
    fireEvent.click(editButton);

    // Change the English name
    const nameEnInput = document.getElementById('edit-template-name-en')!;
    fireEvent.change(nameEnInput, { target: { value: 'Updated Item Name' } });

    // Save
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(mockUpdateCustomTemplate).toHaveBeenCalledTimes(1);
    expect(mockUpdateCustomTemplate).toHaveBeenCalledWith(
      mockCustomTemplates[0].id,
      expect.objectContaining({
        name: 'Updated Item Name',
        names: { en: 'Updated Item Name', fi: 'My Custom Item' },
      }),
    );
  });

  it('should pre-fill form with template data when editing', () => {
    render(<CustomTemplates />);

    const editButton = screen.getByRole('button', {
      name: 'Edit: Water Bottle',
    });
    fireEvent.click(editButton);

    // Get form elements by id
    const nameEnInput = document.getElementById('edit-template-name-en');
    expect(nameEnInput).toHaveValue('Water Bottle');

    const nameFiInput = document.getElementById('edit-template-name-fi');
    expect(nameFiInput).toHaveValue('Water Bottle');

    const categorySelect = document.getElementById('edit-template-category');
    expect(categorySelect).toHaveValue('water-beverages');

    const unitSelect = document.getElementById('edit-template-unit');
    expect(unitSelect).toHaveValue('liters');
  });

  it('should pre-fill form with localized names when template has names object', () => {
    // Modify a template to have localized names
    mockCustomTemplates[0].names = { en: 'English Name', fi: 'Finnish Name' };

    render(<CustomTemplates />);

    const editButton = screen.getByRole('button', {
      name: 'Edit: English Name',
    });
    fireEvent.click(editButton);

    const nameEnInput = document.getElementById('edit-template-name-en');
    expect(nameEnInput).toHaveValue('English Name');

    const nameFiInput = document.getElementById('edit-template-name-fi');
    expect(nameFiInput).toHaveValue('Finnish Name');

    // Reset for other tests
    delete mockCustomTemplates[0].names;
  });

  it('should not call updateCustomTemplate when both name fields are empty', () => {
    render(<CustomTemplates />);

    const editButton = screen.getByRole('button', {
      name: 'Edit: My Custom Item',
    });
    fireEvent.click(editButton);

    // Clear both name fields
    const nameEnInput = document.getElementById('edit-template-name-en')!;
    fireEvent.change(nameEnInput, { target: { value: '' } });

    const nameFiInput = document.getElementById('edit-template-name-fi')!;
    fireEvent.change(nameFiInput, { target: { value: '' } });

    // Try to save
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    // updateCustomTemplate should NOT be called with empty names
    expect(mockUpdateCustomTemplate).not.toHaveBeenCalled();
  });

  it('should not call updateCustomTemplate when both name fields are whitespace only', () => {
    render(<CustomTemplates />);

    const editButton = screen.getByRole('button', {
      name: 'Edit: My Custom Item',
    });
    fireEvent.click(editButton);

    // Set both name fields to whitespace only
    const nameEnInput = document.getElementById('edit-template-name-en')!;
    fireEvent.change(nameEnInput, { target: { value: '   ' } });

    const nameFiInput = document.getElementById('edit-template-name-fi')!;
    fireEvent.change(nameFiInput, { target: { value: '   ' } });

    // Try to save
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    // updateCustomTemplate should NOT be called with empty names
    expect(mockUpdateCustomTemplate).not.toHaveBeenCalled();
  });

  it('should show never-expires checkbox and pre-fill it when editing', () => {
    render(<CustomTemplates />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit: My Custom Item' }),
    );

    const neverExpiresCheckbox = screen.getByRole('checkbox', {
      name: /Never expires/i,
    });
    expect(neverExpiresCheckbox).toBeInTheDocument();
    expect(neverExpiresCheckbox).toBeChecked();
  });

  it('should show default expiration months field when never-expires is unchecked', () => {
    render(<CustomTemplates />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit: My Custom Item' }),
    );

    const neverExpiresCheckbox = screen.getByRole('checkbox', {
      name: /Never expires/i,
    });
    expect(
      document.getElementById('edit-template-expiration-months'),
    ).not.toBeInTheDocument();

    fireEvent.click(neverExpiresCheckbox);
    expect(neverExpiresCheckbox).not.toBeChecked();

    const expirationInput = document.getElementById(
      'edit-template-expiration-months',
    );
    expect(expirationInput).toBeInTheDocument();
  });

  it('should pre-fill and show food fields when editing a food template', () => {
    mockCustomTemplates[0].neverExpires = false;
    mockCustomTemplates[0].defaultExpirationMonths = 24;
    mockCustomTemplates[0].weightGrams = 400;
    mockCustomTemplates[0].caloriesPerUnit = 200;
    mockCustomTemplates[0].caloriesPer100g = 120;
    mockCustomTemplates[0].requiresWaterLiters = 0.5;

    render(<CustomTemplates />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit: My Custom Item' }),
    );

    expect(document.getElementById('edit-template-weight')).toHaveValue(400);
    expect(document.getElementById('edit-template-calories-unit')).toHaveValue(
      200,
    );
    expect(document.getElementById('edit-template-calories-100g')).toHaveValue(
      120,
    );
    expect(document.getElementById('edit-template-water')).toHaveValue(0.5);
    expect(
      document.getElementById('edit-template-expiration-months'),
    ).toHaveValue(24);

    const neverExpiresCheckbox = screen.getByRole('checkbox', {
      name: /Never expires/i,
    });
    expect(neverExpiresCheckbox).not.toBeChecked();

    // Reset for other tests
    delete mockCustomTemplates[0].neverExpires;
    delete mockCustomTemplates[0].defaultExpirationMonths;
    delete mockCustomTemplates[0].weightGrams;
    delete mockCustomTemplates[0].caloriesPerUnit;
    delete mockCustomTemplates[0].caloriesPer100g;
    delete mockCustomTemplates[0].requiresWaterLiters;
  });

  it('should not show food-specific fields when editing a non-food template', () => {
    render(<CustomTemplates />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Water Bottle' }));

    expect(document.getElementById('edit-template-weight')).toBeNull();
    expect(document.getElementById('edit-template-calories-unit')).toBeNull();
    expect(document.getElementById('edit-template-calories-100g')).toBeNull();
    expect(document.getElementById('edit-template-water')).toBeNull();
  });

  it('should call updateCustomTemplate with neverExpires and defaultExpirationMonths when set', () => {
    render(<CustomTemplates />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit: My Custom Item' }),
    );

    const neverExpiresCheckbox = screen.getByRole('checkbox', {
      name: /Never expires/i,
    });
    fireEvent.click(neverExpiresCheckbox);

    const expirationInput = document.getElementById(
      'edit-template-expiration-months',
    )!;
    fireEvent.change(expirationInput, { target: { value: '36' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockUpdateCustomTemplate).toHaveBeenCalledWith(
      mockCustomTemplates[0].id,
      expect.objectContaining({
        neverExpires: false,
        defaultExpirationMonths: 36,
      }),
    );
  });

  it('should call updateCustomTemplate with weight, calories, and water when editing food template', async () => {
    render(<CustomTemplates />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit: My Custom Item' }),
    );

    const dialog = screen.getByRole('dialog');
    const weightInput = within(dialog).getByLabelText(/Weight per unit \(g\)/i);
    const caloriesUnitInput =
      within(dialog).getByLabelText(/Calories per unit/i);
    const calories100gInput =
      within(dialog).getByLabelText(/Calories per 100 g/i);
    const waterInput = within(dialog).getByLabelText(
      /Water for preparation \(L\)/i,
    );

    fireEvent.change(weightInput, { target: { value: '350' } });
    fireEvent.change(caloriesUnitInput, { target: { value: '180' } });
    fireEvent.change(calories100gInput, { target: { value: '95' } });
    fireEvent.change(waterInput, { target: { value: '0.75' } });

    const form = dialog.querySelector('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);

    expect(mockUpdateCustomTemplate).toHaveBeenCalledWith(
      mockCustomTemplates[0].id,
      expect.objectContaining({
        weightGrams: 350,
        caloriesPerUnit: 180,
        caloriesPer100g: 95,
        requiresWaterLiters: 0.75,
      }),
    );
  });

  it('should close modal and reset form when saving', () => {
    render(<CustomTemplates />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit: My Custom Item' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByText('Edit Template')).not.toBeInTheDocument();
  });
});

describe('CustomTemplates with no templates', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should show empty message when no templates exist', async () => {
    // Re-mock with empty array
    vi.doMock('@/features/inventory', () => ({
      useInventory: () => ({
        customTemplates: [],
        updateCustomTemplate: vi.fn(),
        deleteCustomTemplate: vi.fn(),
      }),
    }));

    // Re-import the component after changing the mock
    const { CustomTemplates: EmptyCustomTemplates } =
      await import('./CustomTemplates');

    render(<EmptyCustomTemplates />);

    expect(screen.getByText('No custom templates')).toBeInTheDocument();
    expect(
      screen.getByText(/Create templates by checking/),
    ).toBeInTheDocument();
  });
});
