import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Common/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'number', 'date', 'email', 'password'],
    },
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    type: 'text',
    label: 'Item Name',
    placeholder: 'Enter item name',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    label: 'Quantity',
    placeholder: '0',
    min: 0,
  },
};

export const Date: Story = {
  args: {
    type: 'date',
    label: 'Expiration Date',
  },
};

export const WithHelperText: Story = {
  args: {
    type: 'text',
    label: 'Item Name',
    helperText: 'Enter a descriptive name for the item',
    placeholder: 'e.g., Bottled Water',
  },
};

export const WithError: Story = {
  args: {
    type: 'text',
    label: 'Item Name',
    error: 'Item name is required',
    placeholder: 'Enter item name',
  },
};

export const Required: Story = {
  args: {
    type: 'text',
    label: 'Item Name',
    required: true,
    placeholder: 'Enter item name',
  },
};

export const Disabled: Story = {
  args: {
    type: 'text',
    label: 'Item Name',
    disabled: true,
    value: 'Disabled input',
  },
};

export const FullWidth: Story = {
  args: {
    type: 'text',
    label: 'Item Name',
    placeholder: 'Enter item name',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};
