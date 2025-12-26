import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inventory, InventoryProps } from './Inventory';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { HouseholdProvider } from '../contexts/HouseholdProvider';
import { SettingsProvider } from '../contexts/SettingsProvider';

const meta: Meta<InventoryProps> = {
  title: 'Pages/Inventory',
  component: Inventory,
  parameters: {
    layout: 'fullscreen',
  },
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
};

export default meta;
type Story = StoryObj<InventoryProps>;

export const Default: Story = {
  args: {},
};

export const WithModalOpen: Story = {
  args: {
    openAddModal: true,
  },
};
