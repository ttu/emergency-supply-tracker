import type { Meta, StoryObj } from '@storybook/react-vite';
import { TemplateSelector } from './TemplateSelector';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { RECOMMENDED_ITEMS } from '../data';

const meta = {
  title: 'Features/Templates/TemplateSelector',
  component: TemplateSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a searchable, filterable list of recommended item templates for adding to inventory.',
      },
    },
  },
  argTypes: {
    onSelectTemplate: { action: 'template selected' },
    onSelectCustom: { action: 'custom item selected' },
  },
} satisfies Meta<typeof TemplateSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTemplates: Story = {
  args: {
    templates: RECOMMENDED_ITEMS,
    categories: STANDARD_CATEGORIES,
    onSelectTemplate: () => {},
    onSelectCustom: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows full list of all 70 recommended templates with search and category filtering.',
      },
    },
  },
};

export const FewTemplates: Story = {
  args: {
    templates: RECOMMENDED_ITEMS.slice(0, 5),
    categories: STANDARD_CATEGORIES,
    onSelectTemplate: () => {},
    onSelectCustom: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a small subset of templates for compact display testing.',
      },
    },
  },
};

export const SingleCategory: Story = {
  args: {
    templates: RECOMMENDED_ITEMS.filter(
      (item) => item.category === 'water-beverages',
    ),
    categories: STANDARD_CATEGORIES,
    onSelectTemplate: () => {},
    onSelectCustom: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows templates filtered to a single category (water & beverages).',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    templates: [],
    categories: STANDARD_CATEGORIES,
    onSelectTemplate: () => {},
    onSelectCustom: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows empty state when no templates match the filter criteria.',
      },
    },
  },
};
