import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemCard } from './ItemCard';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createItemId, createCategoryId, createDateOnly } from '@/shared/types';

const meta = {
  title: 'Components/Inventory/ItemCard',
  component: ItemCard,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof ItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const futureDate = createDateOnly(
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
);
const soonDate = createDateOnly(
  new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
);
const expiredDate = createDateOnly(
  new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
);

const baseItem = createMockInventoryItem({
  id: createItemId('1'),
  name: 'Bottled Water',
  categoryId: createCategoryId('water-beverages'),
  quantity: 20,
  unit: 'liters',
  recommendedQuantity: 28,
  neverExpires: false,
  expirationDate: futureDate,
  location: 'Pantry',
});

export const OkStatus: Story = {
  args: {
    item: baseItem,
  },
};

export const WarningLowStock: Story = {
  args: {
    item: {
      ...baseItem,
      quantity: 10,
    },
  },
};

export const CriticalOutOfStock: Story = {
  args: {
    item: {
      ...baseItem,
      quantity: 0,
    },
  },
};

export const ExpiringSoon: Story = {
  args: {
    item: {
      ...baseItem,
      expirationDate: soonDate,
    },
  },
};

export const Expired: Story = {
  args: {
    item: {
      ...baseItem,
      expirationDate: expiredDate,
      quantity: 5,
    },
  },
};

export const NeverExpires: Story = {
  args: {
    item: {
      ...baseItem,
      neverExpires: true,
      expirationDate: undefined,
    },
  },
};

export const NoLocation: Story = {
  args: {
    item: {
      ...baseItem,
      location: '',
    },
  },
};

export const ClickableCard: Story = {
  args: {
    item: baseItem,
    onClick: () => console.log('Card clicked'),
  },
};
