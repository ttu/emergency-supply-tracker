import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryForm } from './CategoryForm';
import type { Category } from '@/shared/types';
import { createCategoryId } from '@/shared/types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.customCategories.form.title.create': 'Create Custom Category',
        'settings.customCategories.form.title.edit': 'Edit Custom Category',
        'settings.customCategories.form.nameEn': 'Name (English)',
        'settings.customCategories.form.nameFi': 'Name (Finnish)',
        'settings.customCategories.form.icon': 'Icon',
        'settings.customCategories.form.iconHelper': 'Enter an emoji',
        'settings.customCategories.form.descriptionEn': 'Description (English)',
        'settings.customCategories.form.descriptionFi': 'Description (Finnish)',
        'settings.customCategories.form.color': 'Color',
        'settings.customCategories.form.sortOrder': 'Sort Order',
        'settings.customCategories.form.sortOrderHelper':
          'Higher numbers appear later',
        'settings.customCategories.form.save': 'Save',
        'settings.customCategories.form.cancel': 'Cancel',
        'settings.customCategories.form.idPreview': 'ID: custom-',
        'settings.customCategories.form.error.nameRequired':
          'English name is required',
        'settings.customCategories.form.error.iconRequired': 'Icon is required',
        'settings.customCategories.form.error.iconInvalid':
          'Icon must be an emoji',
        'settings.customCategories.form.error.idExists':
          'A category with this ID already exists',
      };
      return translations[key] || key;
    },
  }),
}));

describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form when no initial category', () => {
    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByText('Create Custom Category')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name \(English\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Icon/i)).toBeInTheDocument();
  });

  it('renders edit form with populated values', () => {
    const category: Category = {
      id: createCategoryId('custom-camping'),
      name: 'Camping Gear',
      names: { en: 'Camping Gear', fi: 'Retkeilyvarusteet' },
      icon: '🏕️',
      sortOrder: 100,
      isCustom: true,
    };

    render(
      <CategoryForm
        initialCategory={category}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText('Edit Custom Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Camping Gear')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Retkeilyvarusteet')).toBeInTheDocument();
    expect(screen.getByDisplayValue('🏕️')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('English name is required')).toBeInTheDocument();
  });

  it('uses default icon when none provided', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(
      screen.getByLabelText(/Name \(English\)/i),
      'Test Category',
    );
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        names: expect.objectContaining({ en: 'Test Category' }),
        icon: '📦', // Default icon
      }),
    );
  });

  it('validates invalid icon format', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(
      screen.getByLabelText(/Name \(English\)/i),
      'Test Category',
    );
    await user.type(screen.getByLabelText(/Icon/i), 'not-an-emoji');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Icon must be an emoji')).toBeInTheDocument();
  });

  it('submits valid form data', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/Name \(English\)/i), 'New Category');
    await user.type(screen.getByLabelText(/Icon/i), '🎯');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        names: expect.objectContaining({ en: 'New Category' }),
        icon: '🎯',
      }),
    );
  });

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('generates ID preview from English name', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(
      screen.getByLabelText(/Name \(English\)/i),
      'My Custom Category',
    );

    expect(screen.getByText(/my-custom-category/i)).toBeInTheDocument();
  });

  it('includes Finnish name when provided', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(
      screen.getByLabelText(/Name \(English\)/i),
      'Test Category',
    );
    await user.type(screen.getByLabelText(/Name \(Finnish\)/i), 'Testiluokka');
    await user.type(screen.getByLabelText(/Icon/i), '🎯');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        names: { en: 'Test Category', fi: 'Testiluokka' },
      }),
    );
  });

  it('validates duplicate category ID', async () => {
    const user = userEvent.setup();

    render(
      <CategoryForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        existingIds={['custom-test-category']}
      />,
    );

    await user.type(
      screen.getByLabelText(/Name \(English\)/i),
      'Test Category',
    );
    await user.type(screen.getByLabelText(/Icon/i), '🎯');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('A category with this ID already exists'),
    ).toBeInTheDocument();
  });

  it('allows editing without ID conflict for same category', async () => {
    const user = userEvent.setup();
    const category: Category = {
      id: createCategoryId('custom-camping'),
      name: 'Camping',
      names: { en: 'Camping', fi: 'Retkeily' },
      icon: '🏕️',
      sortOrder: 100,
      isCustom: true,
    };

    render(
      <CategoryForm
        initialCategory={category}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        existingIds={['custom-camping', 'custom-travel']}
      />,
    );

    // Modify the name but keep the same base
    await user.clear(screen.getByLabelText(/Name \(English\)/i));
    await user.type(screen.getByLabelText(/Name \(English\)/i), 'Camping Gear');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('includes descriptions when provided', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(
      screen.getByLabelText(/Name \(English\)/i),
      'Test Category',
    );
    await user.type(screen.getByLabelText(/Icon/i), '🎯');
    await user.type(
      screen.getByLabelText(/Description \(English\)/i),
      'English description',
    );
    await user.type(
      screen.getByLabelText(/Description \(Finnish\)/i),
      'Suomenkielinen kuvaus',
    );
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        descriptions: {
          en: 'English description',
          fi: 'Suomenkielinen kuvaus',
        },
      }),
    );
  });

  it('includes color when provided', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(
      screen.getByLabelText(/Name \(English\)/i),
      'Test Category',
    );
    await user.type(screen.getByLabelText(/Icon/i), '🎯');

    // Change color input value using fireEvent (color inputs don't support clear/type)
    const colorInput = screen.getByLabelText(/Color/i);
    fireEvent.change(colorInput, { target: { value: '#ff5500' } });
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#ff5500',
      }),
    );
  });

  it('includes sort order when provided', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(
      screen.getByLabelText(/Name \(English\)/i),
      'Test Category',
    );
    await user.type(screen.getByLabelText(/Icon/i), '🎯');

    // Change sort order
    const sortOrderInput = screen.getByLabelText(/Sort Order/i);
    await user.clear(sortOrderInput);
    await user.type(sortOrderInput, '50');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        sortOrder: 50,
      }),
    );
  });
});
