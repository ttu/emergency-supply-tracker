import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryGrid } from './CategoryGrid';
import { SettingsProvider } from '../../contexts/SettingsProvider';

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
        categoryName: 'Water & Beverages',
        itemCount: 12,
        status: 'ok',
        completionPercentage: 95,
      },
      {
        categoryId: 'food',
        categoryName: 'Food',
        itemCount: 18,
        status: 'ok',
        completionPercentage: 85,
      },
      {
        categoryId: 'cooking-heat',
        categoryName: 'Cooking & Heat',
        itemCount: 5,
        status: 'warning',
        completionPercentage: 60,
      },
      {
        categoryId: 'light-power',
        categoryName: 'Light & Power',
        itemCount: 8,
        status: 'warning',
        completionPercentage: 55,
      },
      {
        categoryId: 'medical-health',
        categoryName: 'Medical & Health',
        itemCount: 3,
        status: 'critical',
        completionPercentage: 30,
      },
      {
        categoryId: 'hygiene-sanitation',
        categoryName: 'Hygiene & Sanitation',
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
        categoryName: 'Water & Beverages',
        itemCount: 12,
        status: 'ok',
        completionPercentage: 100,
      },
      {
        categoryId: 'food',
        categoryName: 'Food',
        itemCount: 18,
        status: 'ok',
        completionPercentage: 95,
      },
      {
        categoryId: 'medical-health',
        categoryName: 'Medical & Health',
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
        categoryName: 'Water & Beverages',
        itemCount: 5,
        status: 'critical',
        completionPercentage: 20,
      },
      {
        categoryId: 'food',
        categoryName: 'Food',
        itemCount: 10,
        status: 'warning',
        completionPercentage: 50,
      },
      {
        categoryId: 'medical-health',
        categoryName: 'Medical & Health',
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
