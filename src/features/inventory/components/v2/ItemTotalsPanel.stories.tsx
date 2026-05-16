import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemTotalsPanel } from './ItemTotalsPanel';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createQuantity } from '@/shared/types';

const meta = {
  title: 'Design V2/Inventory/ItemTotalsPanel',
  component: ItemTotalsPanel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof ItemTotalsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Food: Story = {
  args: {
    item: createMockInventoryItem({
      name: 'Canned beans',
      quantity: createQuantity(8),
      caloriesPerUnit: 250,
      weightGrams: 400,
    }),
  },
};
export const PowerBank: Story = {
  args: {
    item: createMockInventoryItem({
      name: 'Power bank',
      quantity: createQuantity(2),
      capacityWh: 10000,
    }),
  },
};
export const DryFood: Story = {
  args: {
    item: createMockInventoryItem({
      name: 'Pasta',
      quantity: createQuantity(5),
      caloriesPerUnit: 1500,
      weightGrams: 500,
      requiresWaterLiters: 1,
    }),
  },
};
