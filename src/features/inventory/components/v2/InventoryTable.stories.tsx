import type { Meta, StoryObj } from '@storybook/react-vite';
import { InventoryTable } from './InventoryTable';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import {
  createMockInventoryItem,
  createMockCategory,
} from '@/shared/utils/test/factories';
import { createQuantity } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';

const meta = {
  title: 'Design V2/Inventory/InventoryTable',
  component: InventoryTable,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onItemSelect: { action: 'item selected' },
    onQuantityChange: { action: 'quantity change' },
  },
} satisfies Meta<typeof InventoryTable>;
export default meta;
type Story = StoryObj<typeof meta>;

const row = (
  name: string,
  code: string,
  status: DesignItemRow['status'],
): DesignItemRow => ({
  item: createMockInventoryItem({ name, quantity: createQuantity(5) }),
  recommended: 10,
  category: createMockCategory({ name: code }),
  categoryCode: code,
  status,
});

export const WithRows: Story = {
  args: {
    rows: [
      row('Bottled water', 'H2O', 'warn'),
      row('Canned beans', 'FUD', 'ok'),
      row('Batteries', 'PWR', 'crit'),
    ],
    totalRowCount: 3,
    onItemSelect: () => {},
    onQuantityChange: () => {},
  },
};
export const Empty: Story = {
  args: {
    rows: [],
    totalRowCount: 0,
    onItemSelect: () => {},
    onQuantityChange: () => {},
  },
};
