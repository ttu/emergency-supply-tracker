import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'Common/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger', 'info'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    variant: 'info',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    variant: 'success',
    children: 'Large',
  },
};

export const StatusExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="success">In Stock</Badge>
      <Badge variant="warning">Low Stock</Badge>
      <Badge variant="danger">Out of Stock</Badge>
      <Badge variant="info">On Order</Badge>
      <Badge variant="default">Unknown</Badge>
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Badge size="small" variant="success">
        Small
      </Badge>
      <Badge size="medium" variant="success">
        Medium
      </Badge>
      <Badge size="large" variant="success">
        Large
      </Badge>
    </div>
  ),
};

export const ExpirationDates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="success">Expires: 2026</Badge>
      <Badge variant="warning">Expires: 3 months</Badge>
      <Badge variant="danger">Expired</Badge>
    </div>
  ),
};
