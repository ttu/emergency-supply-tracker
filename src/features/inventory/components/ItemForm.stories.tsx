import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemForm } from './ItemForm';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createItemId, createCategoryId, createDateOnly } from '@/shared/types';

const meta = {
  title: 'Components/Inventory/ItemForm',
  component: ItemForm,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSubmit: { action: 'form submitted' },
    onCancel: { action: 'form cancelled' },
  },
} satisfies Meta<typeof ItemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Use fixed dates for deterministic story rendering
const futureDate = createDateOnly('2026-12-31');
const pastDate = createDateOnly('2024-12-01');

const sampleItem = createMockInventoryItem({
  id: createItemId('1'),
  name: 'Bottled Water',
  categoryId: createCategoryId('water-beverages'),
  quantity: 20,
  unit: 'liters',
  recommendedQuantity: 28,
  neverExpires: false,
  expirationDate: futureDate,
  purchaseDate: pastDate,
  location: 'Pantry',
  notes: 'Check expiration dates regularly',
});

export const NewItem: Story = {
  args: {
    categories: STANDARD_CATEGORIES,
    onSubmit: () => {},
    onCancel: () => {},
    defaultRecommendedQuantity: 10,
  },
};

export const EditItem: Story = {
  args: {
    item: sampleItem,
    categories: STANDARD_CATEGORIES,
    onSubmit: () => {},
    onCancel: () => {},
  },
};

export const ItemWithNeverExpires: Story = {
  args: {
    item: {
      ...sampleItem,
      neverExpires: true,
      expirationDate: undefined,
    },
    categories: STANDARD_CATEGORIES,
    onSubmit: () => {},
    onCancel: () => {},
  },
};

export const ItemWithoutPurchaseDate: Story = {
  args: {
    item: {
      ...sampleItem,
      purchaseDate: undefined,
    },
    categories: STANDARD_CATEGORIES,
    onSubmit: () => {},
    onCancel: () => {},
  },
};
