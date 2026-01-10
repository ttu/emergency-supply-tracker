import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dashboard } from './Dashboard';
import { AllProviders } from '@/shared/components/AllProviders';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createItemId, createCategoryId, createDateOnly } from '@/shared/types';

const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  decorators: [
    (Story) => (
      <AllProviders>
        <Story />
      </AllProviders>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onNavigate: { action: 'navigate' },
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

export const Default: Story = {
  args: {},
  render: () => <Dashboard />,
};

export const WithItems: Story = {
  args: {},
  render: () => <Dashboard />,
  decorators: [
    (Story) => {
      // Set up some inventory items in localStorage
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: 20,
          unit: 'liters',
          recommendedQuantity: 28,
          neverExpires: false,
          expirationDate: createDateOnly('2026-12-31'),
          location: 'Pantry',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Canned Beans',
          categoryId: createCategoryId('food'),
          quantity: 15,
          unit: 'cans',
          recommendedQuantity: 20,
          neverExpires: false,
          expirationDate: createDateOnly('2026-06-30'),
          location: 'Pantry',
        }),
        createMockInventoryItem({
          id: createItemId('3'),
          name: 'First Aid Kit',
          categoryId: createCategoryId('medical-health'),
          quantity: 1,
          unit: 'pieces',
          recommendedQuantity: 1,
          neverExpires: true,
          location: 'Closet',
        }),
      ];
      localStorage.setItem('inventory', JSON.stringify(items));

      return (
        <AllProviders>
          <Story />
        </AllProviders>
      );
    },
  ],
};

export const WithAlerts: Story = {
  args: {},
  render: () => <Dashboard />,
  decorators: [
    (Story) => {
      // Set up inventory with items that will trigger alerts
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Expired Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: 10,
          unit: 'liters',
          recommendedQuantity: 28,
          neverExpires: false,
          expirationDate: createDateOnly('2024-01-01'),
          purchaseDate: createDateOnly('2023-12-15'),
          location: 'Pantry',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Low Stock Food',
          categoryId: createCategoryId('food'),
          quantity: 2,
          unit: 'cans',
          recommendedQuantity: 20,
          neverExpires: false,
          expirationDate: createDateOnly('2026-12-31'),
          purchaseDate: createDateOnly('2024-11-01'),
          location: 'Pantry',
        }),
        createMockInventoryItem({
          id: createItemId('3'),
          name: 'Expiring Soon Medicine',
          categoryId: createCategoryId('medical-health'),
          quantity: 5,
          unit: 'pieces',
          recommendedQuantity: 10,
          neverExpires: false,
          expirationDate: createDateOnly(
            new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          ),
          purchaseDate: createDateOnly(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          ),
          location: 'Medicine Cabinet',
        }),
      ];
      localStorage.setItem('inventory', JSON.stringify(items));

      return (
        <AllProviders>
          <Story />
        </AllProviders>
      );
    },
  ],
};

export const WellPrepared: Story = {
  args: {},
  render: () => <Dashboard />,
  decorators: [
    (Story) => {
      // Set up a well-stocked inventory
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: 30,
          unit: 'liters',
          recommendedQuantity: 28,
          neverExpires: false,
          expirationDate: createDateOnly('2026-12-31'),
          location: 'Pantry',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Canned Vegetables',
          categoryId: createCategoryId('food'),
          quantity: 25,
          unit: 'cans',
          recommendedQuantity: 20,
          neverExpires: false,
          expirationDate: createDateOnly('2026-12-31'),
          location: 'Pantry',
        }),
        createMockInventoryItem({
          id: createItemId('3'),
          name: 'Flashlight',
          categoryId: createCategoryId('light-power'),
          quantity: 2,
          unit: 'pieces',
          recommendedQuantity: 2,
          neverExpires: true,
          location: 'Utility Closet',
        }),
        createMockInventoryItem({
          id: createItemId('4'),
          name: 'First Aid Kit',
          categoryId: createCategoryId('medical-health'),
          quantity: 1,
          unit: 'pieces',
          recommendedQuantity: 1,
          neverExpires: true,
          location: 'Bathroom',
        }),
      ];
      localStorage.setItem('inventory', JSON.stringify(items));

      return (
        <AllProviders>
          <Story />
        </AllProviders>
      );
    },
  ],
};
