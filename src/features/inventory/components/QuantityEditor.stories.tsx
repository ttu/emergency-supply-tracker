import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuantityEditor } from './QuantityEditor';
import { createQuantity } from '@/shared/types';

const meta = {
  title: 'Features/Inventory/QuantityEditor',
  component: QuantityEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onQuantityChange: { action: 'quantity changed' },
    onFullEdit: { action: 'full edit clicked' },
    onCancel: { action: 'cancel clicked' },
  },
} satisfies Meta<typeof QuantityEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    quantity: createQuantity(5),
    unit: 'pieces',
    onQuantityChange: () => {},
  },
};

export const WithZeroQuantity: Story = {
  args: {
    quantity: createQuantity(0),
    unit: 'pieces',
    onQuantityChange: () => {},
  },
};

export const WithDecimals: Story = {
  args: {
    quantity: createQuantity(2.5),
    unit: 'kilograms',
    allowDecimal: true,
    onQuantityChange: () => {},
  },
};

export const WithLiters: Story = {
  args: {
    quantity: createQuantity(10),
    unit: 'liters',
    allowDecimal: true,
    onQuantityChange: () => {},
  },
};

export const WithoutFullEdit: Story = {
  args: {
    quantity: createQuantity(5),
    unit: 'pieces',
    onQuantityChange: () => {},
    onFullEdit: undefined,
  },
};

export const WithoutCancel: Story = {
  args: {
    quantity: createQuantity(5),
    unit: 'pieces',
    onQuantityChange: () => {},
    onCancel: undefined,
  },
};

export const LargeNumber: Story = {
  args: {
    quantity: createQuantity(1000),
    unit: 'pieces',
    onQuantityChange: () => {},
  },
};
