import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inventory, InventoryProps } from './Inventory';
import { AllProviders } from '@/shared/components/AllProviders';

const meta: Meta<InventoryProps> = {
  title: 'Pages/Inventory',
  component: Inventory,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AllProviders>
        <Story />
      </AllProviders>
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
    selectedCategoryId: 'water-beverages',
  },
};
