import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'Common/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
    },
    padding: {
      control: 'select',
      options: ['none', 'small', 'medium', 'large'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <div>
        <h3>Card Title</h3>
        <p>This is a default card with some content inside.</p>
      </div>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <div>
        <h3>Outlined Card</h3>
        <p>This card has a thicker border and transparent background.</p>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div>
        <h3>Elevated Card</h3>
        <p>This card has a shadow effect. Hover to see it grow!</p>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'small',
    children: (
      <div>
        <h3>Small Padding</h3>
        <p>This card has small padding.</p>
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'large',
    children: (
      <div>
        <h3>Large Padding</h3>
        <p>This card has large padding.</p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div style={{ padding: '1rem' }}>
        <h3>No Padding</h3>
        <p>This card has no padding from the Card component itself.</p>
      </div>
    ),
  },
};

export const WithComplexContent: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div>
        <h3 style={{ marginTop: 0 }}>Emergency Supply</h3>
        <p style={{ color: '#666' }}>Water bottles - 24 pack</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <span
            style={{
              padding: '0.25rem 0.5rem',
              background: '#e8f5e9',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            In Stock
          </span>
          <span
            style={{
              padding: '0.25rem 0.5rem',
              background: '#fff3e0',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            Expires: 2026
          </span>
        </div>
      </div>
    ),
  },
};
