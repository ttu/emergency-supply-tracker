import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryList } from './CategoryList';
import type { Category } from '@/shared/types';
import { createCategoryId } from '@/shared/types';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'settings.customCategories.empty':
          'No custom categories. Add one to get started.',
        'settings.customCategories.description': `You have ${options?.count || 0} custom category/categories.`,
        'settings.customCategories.edit': 'Edit',
        'settings.customCategories.delete': 'Delete',
        'settings.customCategories.addCategory': 'Add Category',
        'settings.customCategories.confirmDelete':
          'Are you sure you want to delete this category?',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Mock the inventory hook
const mockUpdateCustomCategory = vi.fn();
const mockDeleteCustomCategory = vi.fn(
  () => ({ success: true }) as { success: boolean; error?: string },
);

const mockCustomCategories: Category[] = [
  {
    id: createCategoryId('custom-camping'),
    name: 'Camping Gear',
    icon: '🏕️',
    names: { en: 'Camping Gear', fi: 'Retkeilyvarusteet' },
    sortOrder: 100,
    isCustom: true,
  },
  {
    id: createCategoryId('custom-travel'),
    name: 'Travel Supplies',
    icon: '🚗',
    names: { en: 'Travel Supplies', fi: 'Matkatarvikkeet' },
    sortOrder: 101,
    isCustom: true,
  },
];

vi.mock('@/features/inventory', () => ({
  useInventory: () => ({
    customCategories: mockCustomCategories,
    updateCustomCategory: mockUpdateCustomCategory,
    deleteCustomCategory: mockDeleteCustomCategory,
  }),
}));

describe('CategoryList', () => {
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render list of custom categories', () => {
    render(<CategoryList onEdit={mockOnEdit} />);

    expect(screen.getByText('Camping Gear')).toBeInTheDocument();
    expect(screen.getByText('Travel Supplies')).toBeInTheDocument();
  });

  it('should show description with count', () => {
    render(<CategoryList onEdit={mockOnEdit} />);

    expect(screen.getByText(/You have 2 custom category/)).toBeInTheDocument();
  });

  it('should display category icons', () => {
    render(<CategoryList onEdit={mockOnEdit} />);

    expect(screen.getByText('🏕️')).toBeInTheDocument();
    expect(screen.getByText('🚗')).toBeInTheDocument();
  });

  it('should call onEdit when clicking edit button', () => {
    render(<CategoryList onEdit={mockOnEdit} />);

    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCustomCategories[0]);
  });

  it('should call deleteCustomCategory when clicking delete button and confirming', () => {
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<CategoryList onEdit={mockOnEdit} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteCustomCategory).toHaveBeenCalledWith(
      mockCustomCategories[0].id,
    );

    confirmSpy.mockRestore();
  });

  it('should not delete category when cancel is clicked in confirm dialog', () => {
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<CategoryList onEdit={mockOnEdit} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteCustomCategory).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should show alert when deletion fails', () => {
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    // Mock deleteCustomCategory to return failure
    mockDeleteCustomCategory.mockReturnValueOnce({
      success: false,
      error: 'Category has items assigned',
    });

    render(<CategoryList onEdit={mockOnEdit} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteCustomCategory).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Category has items assigned');

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should render categories in a list', () => {
    render(<CategoryList onEdit={mockOnEdit} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('should have accessible button labels', () => {
    render(<CategoryList onEdit={mockOnEdit} />);

    // Each category should have edit and delete buttons with proper labels
    const editButtons = screen.getAllByRole('button', { name: /Edit.*:/i });
    const deleteButtons = screen.getAllByRole('button', { name: /Delete.*:/i });

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });
});

describe('CategoryList with no custom categories', () => {
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Override the mock to return empty array
    vi.doMock('@/features/inventory', () => ({
      useInventory: () => ({
        customCategories: [],
        updateCustomCategory: vi.fn(),
        deleteCustomCategory: vi.fn(() => ({ success: true })),
      }),
    }));
  });

  it('should show empty message when no custom categories exist', async () => {
    // Re-import with the new mock
    vi.resetModules();
    vi.doMock('@/features/inventory', () => ({
      useInventory: () => ({
        customCategories: [],
        updateCustomCategory: vi.fn(),
        deleteCustomCategory: vi.fn(() => ({ success: true })),
      }),
    }));

    const { CategoryList: CategoryListEmpty } = await import('./CategoryList');
    render(<CategoryListEmpty onEdit={mockOnEdit} />);

    expect(
      screen.getByText('No custom categories. Add one to get started.'),
    ).toBeInTheDocument();
  });
});
