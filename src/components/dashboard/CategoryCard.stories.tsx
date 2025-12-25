import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryCard } from './CategoryCard';
import { SettingsProvider } from '../../contexts/SettingsProvider';

const meta = {
  title: 'Dashboard/CategoryCard',
  component: CategoryCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <div style={{ width: '400px' }}>
          <Story />
        </div>
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof CategoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatusOk: Story = {
  args: {
    categoryId: 'water-beverages',
    categoryName: 'Water & Beverages',
    itemCount: 12,
    status: 'ok',
    completionPercentage: 95,
  },
};

export const StatusWarning: Story = {
  args: {
    categoryId: 'food',
    categoryName: 'Food',
    itemCount: 8,
    status: 'warning',
    completionPercentage: 60,
  },
};

export const StatusCritical: Story = {
  args: {
    categoryId: 'medical-health',
    categoryName: 'Medical & Health',
    itemCount: 3,
    status: 'critical',
    completionPercentage: 25,
  },
};

export const Empty: Story = {
  args: {
    categoryId: 'communication-info',
    categoryName: 'Communication',
    itemCount: 0,
    status: 'critical',
    completionPercentage: 0,
  },
};

export const Clickable: Story = {
  args: {
    categoryId: 'water-beverages',
    categoryName: 'Water & Beverages',
    itemCount: 12,
    status: 'ok',
    completionPercentage: 95,
    onClick: () => {
      alert('Category clicked!');
    },
  },
};
