import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuantityStepper } from './QuantityStepper';
import { AllProviders } from '@/shared/components/AllProviders';

const meta = {
  title: 'Components/Inventory/QuantityStepper',
  component: QuantityStepper,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <AllProviders>
        <Story />
      </AllProviders>
    ),
  ],
  args: {
    onChange: () => {},
  },
  argTypes: {
    onChange: { action: 'quantity changed' },
  },
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    quantity: 5,
    unit: 'pieces',
  },
};

export const ZeroQuantity: Story = {
  args: {
    quantity: 0,
    unit: 'pieces',
  },
};

export const Liters: Story = {
  args: {
    quantity: 12,
    unit: 'liters',
  },
};

export const Kilograms: Story = {
  args: {
    quantity: 2.5,
    unit: 'kilograms',
  },
};

export const Disabled: Story = {
  args: {
    quantity: 5,
    unit: 'pieces',
    disabled: true,
  },
};

export const WithPulse: Story = {
  args: {
    quantity: 5,
    unit: 'pieces',
    showPulse: true,
  },
};

export const Interactive: Story = {
  args: {
    quantity: 5,
    unit: 'pieces',
  },
  render: function InteractiveStepper(args) {
    const [quantity, setQuantity] = useState(args.quantity);
    return (
      <QuantityStepper
        quantity={quantity}
        unit={args.unit}
        onChange={setQuantity}
      />
    );
  },
};

export const InCard: Story = {
  args: {
    quantity: 10,
    unit: 'liters',
  },
  render: function StepperInCard(args) {
    const [quantity, setQuantity] = useState(args.quantity);
    return (
      <div
        style={{
          padding: '1rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem' }}>Bottled Water</h3>
        <QuantityStepper
          quantity={quantity}
          unit={args.unit}
          onChange={setQuantity}
        />
      </div>
    );
  },
};
