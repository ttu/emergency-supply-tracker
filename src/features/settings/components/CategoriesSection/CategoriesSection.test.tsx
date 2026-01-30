import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoriesSection } from './CategoriesSection';
import type { Category } from '@/shared/types';
import { createCategoryId } from '@/shared/types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.customCategories.title': 'Custom Categories',
        'settings.customCategories.addCategory': 'Add Category',
        'settings.customCategories.empty': 'No custom categories',
        'settings.customCategories.description': 'You have custom categories.',
        'settings.customCategories.edit': 'Edit',
        'settings.customCategories.delete': 'Delete',
        'settings.customCategories.confirmDelete':
          'Are you sure you want to delete?',
        'settings.customCategories.form.title.create': 'Create Category',
        'settings.customCategories.form.title.edit': 'Edit Category',
        'settings.customCategories.form.save': 'Save',
        'settings.customCategories.form.cancel': 'Cancel',
        'accessibility.closeModal': 'Close',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Mock inventory hook
const mockAddCustomCategory = vi.fn();
const mockUpdateCustomCategory = vi.fn();
const mockDeleteCustomCategory = vi.fn(() => ({ success: true }));

const mockCustomCategories: Category[] = [
  {
    id: createCategoryId('custom-camping'),
    name: 'Camping',
    names: { en: 'Camping', fi: 'Retkeily' },
    icon: '🏕️',
    sortOrder: 100,
    isCustom: true,
  },
];

vi.mock('@/features/inventory', () => ({
  useInventory: () => ({
    customCategories: mockCustomCategories,
    addCustomCategory: mockAddCustomCategory,
    updateCustomCategory: mockUpdateCustomCategory,
    deleteCustomCategory: mockDeleteCustomCategory,
  }),
}));

describe('CategoriesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section title', () => {
    render(<CategoriesSection />);

    expect(screen.getByText('Custom Categories')).toBeInTheDocument();
  });

  it('renders add category button', () => {
    render(<CategoriesSection />);

    expect(
      screen.getByRole('button', { name: /add category/i }),
    ).toBeInTheDocument();
  });

  it('shows CategoryList with custom categories', () => {
    render(<CategoriesSection />);

    expect(screen.getByText('Camping')).toBeInTheDocument();
    expect(screen.getByText('🏕️')).toBeInTheDocument();
  });

  it('opens form modal when add button is clicked', () => {
    render(<CategoriesSection />);

    fireEvent.click(screen.getByRole('button', { name: /add category/i }));

    expect(screen.getByText('Create Category')).toBeInTheDocument();
  });

  it('opens form modal when edit button is clicked', () => {
    render(<CategoriesSection />);

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Category')).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', () => {
    render(<CategoriesSection />);

    // Open the modal
    fireEvent.click(screen.getByRole('button', { name: /add category/i }));
    expect(screen.getByText('Create Category')).toBeInTheDocument();

    // Find and click cancel button inside the modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal should be closed (title no longer visible)
    expect(screen.queryByText('Create Category')).not.toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<CategoriesSection />);

    // Open the modal
    fireEvent.click(screen.getByRole('button', { name: /add category/i }));
    expect(screen.getByText('Create Category')).toBeInTheDocument();

    // Click the modal close button
    const closeButton = screen.getByTestId('modal-close-button');
    fireEvent.click(closeButton);

    // Modal should be closed
    expect(screen.queryByText('Create Category')).not.toBeInTheDocument();
  });
});
