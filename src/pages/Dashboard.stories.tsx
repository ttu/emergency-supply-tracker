import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dashboard } from './Dashboard';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { HouseholdProvider } from '../contexts/HouseholdProvider';
import { SettingsProvider } from '../contexts/SettingsProvider';
import type { InventoryItem } from '../types';

const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <HouseholdProvider>
          <InventoryProvider>
            <Story />
          </InventoryProvider>
        </HouseholdProvider>
      </SettingsProvider>
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
      const now = new Date().toISOString();
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Bottled Water',
          categoryId: 'water-beverages',
          quantity: 20,
          unit: 'liters',
          recommendedQuantity: 28,
          neverExpires: false,
          expirationDate: '2026-12-31',
          location: 'Pantry',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          name: 'Canned Beans',
          categoryId: 'food',
          quantity: 15,
          unit: 'cans',
          recommendedQuantity: 20,
          neverExpires: false,
          expirationDate: '2026-06-30',
          location: 'Pantry',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '3',
          name: 'First Aid Kit',
          categoryId: 'medical-health',
          quantity: 1,
          unit: 'pieces',
          recommendedQuantity: 1,
          neverExpires: true,
          location: 'Closet',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
      ];
      localStorage.setItem('inventory', JSON.stringify(items));

      return (
        <SettingsProvider>
          <HouseholdProvider>
            <InventoryProvider>
              <Story />
            </InventoryProvider>
          </HouseholdProvider>
        </SettingsProvider>
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
      const now = new Date().toISOString();
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Expired Water',
          categoryId: 'water-beverages',
          quantity: 10,
          unit: 'liters',
          recommendedQuantity: 28,
          neverExpires: false,
          expirationDate: '2024-01-01',
          location: 'Pantry',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          name: 'Low Stock Food',
          categoryId: 'food',
          quantity: 2,
          unit: 'cans',
          recommendedQuantity: 20,
          neverExpires: false,
          expirationDate: '2026-12-31',
          location: 'Pantry',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '3',
          name: 'Expiring Soon Medicine',
          categoryId: 'medical-health',
          quantity: 5,
          unit: 'pieces',
          recommendedQuantity: 10,
          neverExpires: false,
          expirationDate: new Date(
            Date.now() + 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          location: 'Medicine Cabinet',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
      ];
      localStorage.setItem('inventory', JSON.stringify(items));

      return (
        <SettingsProvider>
          <HouseholdProvider>
            <InventoryProvider>
              <Story />
            </InventoryProvider>
          </HouseholdProvider>
        </SettingsProvider>
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
      const now = new Date().toISOString();
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Bottled Water',
          categoryId: 'water-beverages',
          quantity: 30,
          unit: 'liters',
          recommendedQuantity: 28,
          neverExpires: false,
          expirationDate: '2026-12-31',
          location: 'Pantry',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          name: 'Canned Vegetables',
          categoryId: 'food',
          quantity: 25,
          unit: 'cans',
          recommendedQuantity: 20,
          neverExpires: false,
          expirationDate: '2026-12-31',
          location: 'Pantry',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '3',
          name: 'Flashlight',
          categoryId: 'light-power',
          quantity: 2,
          unit: 'pieces',
          recommendedQuantity: 2,
          neverExpires: true,
          location: 'Utility Closet',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '4',
          name: 'First Aid Kit',
          categoryId: 'medical-health',
          quantity: 1,
          unit: 'pieces',
          recommendedQuantity: 1,
          neverExpires: true,
          location: 'Bathroom',
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
      ];
      localStorage.setItem('inventory', JSON.stringify(items));

      return (
        <SettingsProvider>
          <HouseholdProvider>
            <InventoryProvider>
              <Story />
            </InventoryProvider>
          </HouseholdProvider>
        </SettingsProvider>
      );
    },
  ],
};
