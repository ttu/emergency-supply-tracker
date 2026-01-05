import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemList } from './ItemList';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createItemId, createCategoryId } from '@/shared/types';

const meta = {
  title: 'Components/Inventory/ItemList',
  component: ItemList,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onItemClick: { action: 'item clicked' },
  },
} satisfies Meta<typeof ItemList>;

export default meta;
type Story = StoryObj<typeof meta>;

const futureDate = new Date(
  Date.now() + 365 * 24 * 60 * 60 * 1000,
).toISOString();

const sampleItems = [
  createMockInventoryItem({
    id: createItemId('1'),
    name: 'Bottled Water',
    categoryId: createCategoryId('water-beverages'),
    quantity: 20,
    unit: 'liters',
    recommendedQuantity: 28,
    neverExpires: false,
    expirationDate: futureDate,
    location: 'Pantry',
  }),
  createMockInventoryItem({
    id: createItemId('2'),
    name: 'Canned Beans',
    categoryId: createCategoryId('food'),
    quantity: 5,
    unit: 'cans',
    recommendedQuantity: 20,
    neverExpires: false,
    expirationDate: futureDate,
    location: 'Pantry',
  }),
  createMockInventoryItem({
    id: createItemId('3'),
    name: 'First Aid Kit',
    categoryId: createCategoryId('medical-health'),
    quantity: 1,
    unit: 'pieces',
    recommendedQuantity: 1,
    neverExpires: true,
    location: 'Bathroom',
  }),
];

export const WithItems: Story = {
  args: {
    items: sampleItems,
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};

export const SingleItem: Story = {
  args: {
    items: [sampleItems[0]],
  },
};

export const CustomEmptyMessage: Story = {
  args: {
    items: [],
    emptyMessage: 'No items in this category',
  },
};
