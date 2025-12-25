import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateSelector } from './TemplateSelector';
import { STANDARD_CATEGORIES } from '../../data/standardCategories';
import type { RecommendedItemDefinition } from '../../types';

// Mock i18next
jest.mock('react-i18next', () => ({
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
      id: 'water-1',
      i18nKey: 'Bottled Water',
      category: 'water-beverages',
      baseQuantity: 14,
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
    },
    {
      id: 'food-1',
      i18nKey: 'Canned Beans',
      category: 'food',
      baseQuantity: 5,
      unit: 'cans',
      scaleWithPeople: true,
      scaleWithDays: true,
    },
    {
      id: 'first-aid-1',
      i18nKey: 'First Aid Kit',
      category: 'medical-health',
      baseQuantity: 1,
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    },
  ];

  const mockOnSelectTemplate = jest.fn();

  beforeEach(() => {
    mockOnSelectTemplate.mockClear();
  });

  it('should render all templates', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
      />,
    );

    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
    expect(screen.getByText('Canned Beans')).toBeInTheDocument();
    expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
  });

  it('should display category for each template', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
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
      />,
    );

    const searchInput = screen.getByLabelText('templateSelector.searchLabel');
    fireEvent.change(searchInput, { target: { value: 'water' } });

    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
    expect(screen.queryByText('Canned Beans')).not.toBeInTheDocument();
    expect(screen.queryByText('First Aid Kit')).not.toBeInTheDocument();
  });

  it('should filter templates by category', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
      />,
    );

    const categorySelect = screen.getByLabelText(
      'templateSelector.categoryLabel',
    );
    fireEvent.change(categorySelect, { target: { value: 'food' } });

    expect(screen.queryByText('Bottled Water')).not.toBeInTheDocument();
    expect(screen.getByText('Canned Beans')).toBeInTheDocument();
    expect(screen.queryByText('First Aid Kit')).not.toBeInTheDocument();
  });

  it('should filter by both search and category', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
      />,
    );

    const searchInput = screen.getByLabelText('templateSelector.searchLabel');
    const categorySelect = screen.getByLabelText(
      'templateSelector.categoryLabel',
    );

    fireEvent.change(categorySelect, { target: { value: 'water-beverages' } });
    fireEvent.change(searchInput, { target: { value: 'water' } });

    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
    expect(screen.queryByText('Canned Beans')).not.toBeInTheDocument();
    expect(screen.queryByText('First Aid Kit')).not.toBeInTheDocument();
  });

  it('should show empty state when no templates match', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
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
      />,
    );

    const waterTemplate = screen.getByText('Bottled Water').closest('button');
    fireEvent.click(waterTemplate!);

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('should display category icon for each template', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={mockOnSelectTemplate}
      />,
    );

    // Find templates by their text and verify they have icons (emojis)
    const waterCard = screen.getByText('Bottled Water').closest('button');
    const foodCard = screen.getByText('Canned Beans').closest('button');
    const medicalCard = screen.getByText('First Aid Kit').closest('button');

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
      />,
    );

    const searchInput = screen.getByLabelText('templateSelector.searchLabel');
    fireEvent.change(searchInput, { target: { value: 'WATER' } });

    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
  });
});
