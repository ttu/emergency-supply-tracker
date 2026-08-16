import type { Meta, StoryObj } from '@storybook/react-vite';
import { InventoryFilterStrip } from './InventoryFilterStrip';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/InventoryFilterStrip',
  component: InventoryFilterStrip,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onFilterChange: { action: 'filter changed' },
    onSearchChange: { action: 'search changed' },
  },
} satisfies Meta<typeof InventoryFilterStrip>;
export default meta;
type Story = StoryObj<typeof meta>;

const counts = { all: 12, crit: 2, warn: 3, ok: 7, exp: 1, missing: 4 };
export const All: Story = {
  args: {
    filter: 'all',
    onFilterChange: () => {},
    counts,
    search: '',
    onSearchChange: () => {},
    locationFilter: 'all',
    onLocationFilterChange: () => {},
    locations: ['Pantry', 'Garage'],
    sortBy: 'name',
    onSortByChange: () => {},
  },
};
export const CritFilter: Story = { args: { ...All.args!, filter: 'crit' } };
export const Searching: Story = { args: { ...All.args!, search: 'water' } };
