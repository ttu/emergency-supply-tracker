import type { Meta, StoryObj } from '@storybook/react-vite';
import { TemplateSelector } from './TemplateSelector';
import { STANDARD_CATEGORIES } from '../../data/standardCategories';
import { RECOMMENDED_ITEMS } from '../../data/recommendedItems';

const meta = {
  title: 'Components/Inventory/TemplateSelector',
  component: TemplateSelector,
  parameters: {
    layout: 'padded',
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
};

export const FewTemplates: Story = {
  args: {
    templates: RECOMMENDED_ITEMS.slice(0, 5),
    categories: STANDARD_CATEGORIES,
    onSelectTemplate: () => {},
    onSelectCustom: () => {},
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
};

export const Empty: Story = {
  args: {
    templates: [],
    categories: STANDARD_CATEGORIES,
    onSelectTemplate: () => {},
    onSelectCustom: () => {},
  },
};
