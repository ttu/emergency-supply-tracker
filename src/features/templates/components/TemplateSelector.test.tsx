import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateSelector } from './TemplateSelector';
import { STANDARD_CATEGORIES } from '@/features/categories';
import type { RecommendedItemDefinition } from '@/shared/types';
import { createProductTemplateId } from '@/shared/types';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key.startsWith('categories.')) return key.replace('categories.', '');
      if (key.startsWith('units.')) return key.replace('units.', '');
      if (key.startsWith('products.')) return key.replace('products.', '');
      return key;
    },
  }),
}));

describe('TemplateSelector', () => {
  const mockTemplates: RecommendedItemDefinition[] = [
    {
      id: createProductTemplateId('water-1'),
      i18nKey: 'products.bottled-water',
      category: 'water-beverages',
      baseQuantity: 14,
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
    },
    {
      id: createProductTemplateId('food-1'),
      i18nKey: 'products.canned-beans',
      category: 'food',
      baseQuantity: 5,
      unit: 'cans',
      scaleWithPeople: true,
      scaleWithDays: true,
    },
    {
      id: createProductTemplateId('first-aid-1'),
      i18nKey: 'products.first-aid-kit',
      category: 'medical-health',
      baseQuantity: 1,
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    },
  ];

  const mockOnSelectTemplate = vi.fn();

  beforeEach(() => {
    mockOnSelectTemplate.mockClear();
  });

  it('should render all templates', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    expect(screen.getByText('bottled-water')).toBeInTheDocument();
    expect(screen.getByText('canned-beans')).toBeInTheDocument();
    expect(screen.getByText('first-aid-kit')).toBeInTheDocument();
  });

  it('should display category for each template', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    // Use getAllByText since categories appear in both the template cards and the select dropdown
    expect(screen.getAllByText('water-beverages').length).toBeGreaterThan(0);
    expect(screen.getAllByText('food').length).toBeGreaterThan(0);
    expect(screen.getAllByText('medical-health').length).toBeGreaterThan(0);
  });

  it('should display recommended quantity for each template', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    expect(screen.getByText(/14 liters/)).toBeInTheDocument();
    expect(screen.getByText(/5 cans/)).toBeInTheDocument();
    expect(screen.getByText(/1 pieces/)).toBeInTheDocument();
  });

  it('should filter templates by search query', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    const searchInput = screen.getByLabelText('templateSelector.searchLabel');
    fireEvent.change(searchInput, { target: { value: 'water' } });

    expect(screen.getByText('bottled-water')).toBeInTheDocument();
    expect(screen.queryByText('canned-beans')).not.toBeInTheDocument();
    expect(screen.queryByText('first-aid-kit')).not.toBeInTheDocument();
  });

  it('should filter templates by category', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    const categorySelect = screen.getByLabelText(
      'templateSelector.categoryLabel',
    );
    fireEvent.change(categorySelect, { target: { value: 'food' } });

    expect(screen.queryByText('bottled-water')).not.toBeInTheDocument();
    expect(screen.getByText('canned-beans')).toBeInTheDocument();
    expect(screen.queryByText('first-aid-kit')).not.toBeInTheDocument();
  });

  it('should filter by both search and category', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    const searchInput = screen.getByLabelText('templateSelector.searchLabel');
    const categorySelect = screen.getByLabelText(
      'templateSelector.categoryLabel',
    );

    fireEvent.change(categorySelect, { target: { value: 'water-beverages' } });
    fireEvent.change(searchInput, { target: { value: 'water' } });

    expect(screen.getByText('bottled-water')).toBeInTheDocument();
    expect(screen.queryByText('canned-beans')).not.toBeInTheDocument();
    expect(screen.queryByText('first-aid-kit')).not.toBeInTheDocument();
  });

  it('should show empty state when no templates match', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    const searchInput = screen.getByLabelText('templateSelector.searchLabel');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(
      screen.getByText('templateSelector.noTemplates'),
    ).toBeInTheDocument();
  });

  it('should show empty state when templates array is empty', () => {
    render(
      <TemplateSelector
        templates={[]}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    expect(
      screen.getByText('templateSelector.noTemplates'),
    ).toBeInTheDocument();
  });

  it('should call onSelectTemplate when template is clicked', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    const waterTemplate = screen.getByText('bottled-water').closest('button');
    fireEvent.click(waterTemplate!);

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('should display category icon for each template', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    // Find templates by their text and verify they have icons (emojis)
    const waterCard = screen.getByText('bottled-water').closest('button');
    const foodCard = screen.getByText('canned-beans').closest('button');
    const medicalCard = screen.getByText('first-aid-kit').closest('button');

    expect(waterCard).toHaveTextContent('💧');
    expect(foodCard).toHaveTextContent('🍽️'); // Food category uses fork/knife icon
    expect(medicalCard).toHaveTextContent('🏥'); // Medical category uses hospital icon
  });

  it('should search case-insensitively', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
      />,
    );

    const searchInput = screen.getByLabelText('templateSelector.searchLabel');
    fireEvent.change(searchInput, { target: { value: 'WATER' } });

    expect(screen.getByText('bottled-water')).toBeInTheDocument();
  });

  it('should pre-select category when initialCategoryId is provided', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
        onSelectCustom={() => {}}
        initialCategoryId="food"
      />,
    );

    // Should only show food templates
    expect(screen.queryByText('bottled-water')).not.toBeInTheDocument();
    expect(screen.getByText('canned-beans')).toBeInTheDocument();
    expect(screen.queryByText('first-aid-kit')).not.toBeInTheDocument();

    // Category select should have food selected
    const categorySelect = screen.getByLabelText(
      'templateSelector.categoryLabel',
    ) as HTMLSelectElement;
    expect(categorySelect.value).toBe('food');
  });
});
