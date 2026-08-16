import type { Meta, StoryObj } from '@storybook/react-vite';
import { InventoryRow } from './InventoryRow';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import {
  createMockInventoryItem,
  createMockCategory,
} from '@/shared/utils/test/factories';
import { createDateOnly, createQuantity } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';

const meta = {
  title: 'Design V2/Inventory/InventoryRow',
  component: InventoryRow,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onSelect: { action: 'select' },
    onQuantityChange: { action: 'quantity change' },
  },
} satisfies Meta<typeof InventoryRow>;
export default meta;
type Story = StoryObj<typeof meta>;

const makeRow = (overrides?: Partial<DesignItemRow>): DesignItemRow => ({
  item: createMockInventoryItem({
    name: 'Bottled water',
    quantity: createQuantity(3),
    location: 'Pantry',
    expirationDate: createDateOnly('2027-01-01'),
  }),
  recommended: 10,
  category: createMockCategory({ name: 'Water' }),
  categoryCode: 'H2O',
  status: 'warn',
  ...overrides,
});

const cellStyles = {
  display: 'grid',
  gridTemplateColumns:
    '80px minmax(160px, 1fr) 70px 110px 100px minmax(80px, 110px) 80px',
  columnGap: 12,
  padding: '12px 20px',
  alignItems: 'center',
  fontSize: 13,
} as const;

export const OkStatus: Story = {
  args: {
    row: makeRow({ status: 'ok' }),
    cellStyles,
    isLast: false,
    onSelect: () => {},
    onQuantityChange: () => {},
  },
};
export const WarnStatus: Story = {
  args: {
    row: makeRow({ status: 'warn' }),
    cellStyles,
    isLast: false,
    onSelect: () => {},
    onQuantityChange: () => {},
  },
};
export const CritStatus: Story = {
  args: {
    row: makeRow({
      status: 'crit',
      item: createMockInventoryItem({
        name: 'Empty',
        quantity: createQuantity(0),
      }),
    }),
    cellStyles,
    isLast: true,
    onSelect: () => {},
    onQuantityChange: () => {},
  },
};
