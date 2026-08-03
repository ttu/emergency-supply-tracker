import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryStatusStrip } from './CategoryStatusStrip';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/CategoryStatusStrip',
  component: CategoryStatusStrip,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof CategoryStatusStrip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AllCategories: Story = {
  args: {
    label: 'All categories',
    status: 'warn',
    coverage: 76,
    shortCount: 8,
  },
};

export const Healthy: Story = {
  args: {
    label: 'Water & Beverages',
    status: 'ok',
    coverage: 100,
    shortCount: 0,
  },
};

export const LowStock: Story = {
  args: {
    label: 'Water & Beverages',
    status: 'warn',
    coverage: 62,
    shortCount: 3,
  },
};

export const Critical: Story = {
  args: {
    label: 'Water & Beverages',
    status: 'crit',
    coverage: 18,
    shortCount: 5,
  },
};

/** One short item — the label reads singular. */
export const SingleShortage: Story = {
  args: {
    label: 'Cash & Documents',
    status: 'warn',
    coverage: 88,
    shortCount: 1,
  },
};

export const NothingStocked: Story = {
  args: {
    label: 'Tools & Supplies',
    status: 'crit',
    coverage: 0,
    shortCount: 9,
  },
};

/** A category name long enough to prove the label truncates rather than wraps. */
export const LongLabel: Story = {
  args: {
    label: 'Hygiene, Sanitation & Household Cleaning Supplies',
    status: 'warn',
    coverage: 62,
    shortCount: 3,
  },
};

export const Stacked: Story = {
  args: {
    label: 'Water & Beverages',
    status: 'warn',
    coverage: 62,
    shortCount: 3,
    stacked: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 343 }}>
        <Story />
      </div>
    ),
  ],
};
