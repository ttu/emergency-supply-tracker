import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inventory } from './Inventory';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { HouseholdProvider } from '../contexts/HouseholdProvider';
import { SettingsProvider } from '../contexts/SettingsProvider';

const meta = {
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
} satisfies Meta<typeof Inventory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithItems: Story = {
  decorators: [
    (Story) => {
      // This story would ideally pre-populate some items
      // For now it shows the empty state which is fine for Storybook
      return <Story />;
    },
  ],
};
