import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryNav } from './CategoryNav';
import { STANDARD_CATEGORIES } from '@/features/categories';

const meta = {
  title: 'Components/Inventory/CategoryNav',
  component: CategoryNav,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSelectCategory: { action: 'category selected' },
  },
} satisfies Meta<typeof CategoryNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllCategories: Story = {
  args: {
    categories: STANDARD_CATEGORIES,
    selectedCategoryId: null,
    onSelectCategory: () => {},
  },
};

export const WithSelection: Story = {
  args: {
    categories: STANDARD_CATEGORIES,
    selectedCategoryId: 'water-beverages',
    onSelectCategory: () => {},
  },
};

export const FewCategories: Story = {
  args: {
    categories: STANDARD_CATEGORIES.slice(0, 3),
    selectedCategoryId: null,
    onSelectCategory: () => {},
  },
};
