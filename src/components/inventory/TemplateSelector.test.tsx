/**
 * @deprecated Tests for TemplateSelector are now in @/features/templates/components/TemplateSelector.test.tsx
 * This file is kept to ensure backward compatibility during migration.
 * The actual tests are run from the feature location.
 */

// Re-run the tests from the feature location by importing the component from there
import { render, screen } from '@testing-library/react';
import { TemplateSelector } from '@/features/templates';
import { STANDARD_CATEGORIES } from '@/features/categories';
import type { RecommendedItemDefinition } from '@/shared/types';

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

describe('TemplateSelector (backward compatibility)', () => {
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
  ];

  it('should be importable from old location', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        categories={STANDARD_CATEGORIES}
        onSelectTemplate={() => {}}
        onSelectCustom={() => {}}
      />,
    );

    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
  });
});
