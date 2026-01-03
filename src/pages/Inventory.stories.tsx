import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inventory, InventoryProps } from './Inventory';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/shared/contexts/InventoryProvider';
import { SettingsProvider } from '@/shared/contexts/SettingsProvider';
import { RecommendedItemsProvider } from '@/shared/contexts/RecommendedItemsProvider';

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
          <RecommendedItemsProvider>
            <InventoryProvider>
              <Story />
            </InventoryProvider>
          </RecommendedItemsProvider>
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

export const WithCategoryFilter: Story = {
  args: {
    initialCategoryId: 'water-beverages',
  },
};
