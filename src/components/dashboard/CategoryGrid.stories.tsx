import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryGrid } from './CategoryGrid';
import { SettingsProvider } from '@/shared/contexts/SettingsProvider';

const meta = {
  title: 'Dashboard/CategoryGrid',
  component: CategoryGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <Story />
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof CategoryGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    categories: [
      {
        categoryId: 'water-beverages',
        itemCount: 12,
        status: 'ok',
        completionPercentage: 95,
      },
      {
        categoryId: 'food',
        itemCount: 18,
        status: 'ok',
        completionPercentage: 85,
      },
      {
        categoryId: 'cooking-heat',
        itemCount: 5,
        status: 'warning',
        completionPercentage: 60,
      },
      {
        categoryId: 'light-power',
        itemCount: 8,
        status: 'warning',
        completionPercentage: 55,
      },
      {
        categoryId: 'medical-health',
        itemCount: 3,
        status: 'critical',
        completionPercentage: 30,
      },
      {
        categoryId: 'hygiene-sanitation',
        itemCount: 6,
        status: 'ok',
        completionPercentage: 75,
      },
    ],
  },
};

export const AllOk: Story = {
  args: {
    categories: [
      {
        categoryId: 'water-beverages',
        itemCount: 12,
        status: 'ok',
        completionPercentage: 100,
      },
      {
        categoryId: 'food',
        itemCount: 18,
        status: 'ok',
        completionPercentage: 95,
      },
      {
        categoryId: 'medical-health',
        itemCount: 10,
        status: 'ok',
        completionPercentage: 90,
      },
    ],
  },
};

export const MixedStatuses: Story = {
  args: {
    categories: [
      {
        categoryId: 'water-beverages',
        itemCount: 5,
        status: 'critical',
        completionPercentage: 20,
      },
      {
        categoryId: 'food',
        itemCount: 10,
        status: 'warning',
        completionPercentage: 50,
      },
      {
        categoryId: 'medical-health',
        itemCount: 15,
        status: 'ok',
        completionPercentage: 95,
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    categories: [],
  },
};
