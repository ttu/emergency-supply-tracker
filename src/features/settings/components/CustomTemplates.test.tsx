import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomTemplates } from './CustomTemplates';
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
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'itemForm.name': 'Name',
        'itemForm.category': 'Category',
        'itemForm.unit': 'Unit',
        food: 'Food',
        'water-beverages': 'Water & Beverages',
        'medical-health': 'Medical & Health',
        'units.pieces': 'pieces',
        'units.liters': 'liters',
        'units.cans': 'cans',
      };
      return translations[key] || key;
    },
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
const mockCustomTemplates = [
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
    // The form input should have the template name
    const nameInput = document.getElementById('edit-template-name');
    expect(nameInput).toHaveValue('My Custom Item');
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

    // Change the name
    const nameInput = document.getElementById('edit-template-name')!;
    fireEvent.change(nameInput, { target: { value: 'Updated Item Name' } });

    // Save
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(mockUpdateCustomTemplate).toHaveBeenCalledTimes(1);
    expect(mockUpdateCustomTemplate).toHaveBeenCalledWith(
      mockCustomTemplates[0].id,
      expect.objectContaining({
        name: 'Updated Item Name',
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
    const nameInput = document.getElementById('edit-template-name');
    expect(nameInput).toHaveValue('Water Bottle');

    const categorySelect = document.getElementById('edit-template-category');
    expect(categorySelect).toHaveValue('water-beverages');

    const unitSelect = document.getElementById('edit-template-unit');
    expect(unitSelect).toHaveValue('liters');
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
