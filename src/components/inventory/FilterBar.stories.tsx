import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterBar } from './FilterBar';

const meta = {
  title: 'Components/Inventory/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSearchChange: { action: 'search changed' },
    onStatusFilterChange: { action: 'status filter changed' },
    onSortByChange: { action: 'sort changed' },
  },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    searchQuery: '',
    statusFilter: 'all',
    sortBy: 'name',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onSortByChange: () => {},
  },
};

export const WithSearch: Story = {
  args: {
    searchQuery: 'water',
    statusFilter: 'all',
    sortBy: 'name',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onSortByChange: () => {},
  },
};

export const FilteredByCritical: Story = {
  args: {
    searchQuery: '',
    statusFilter: 'critical',
    sortBy: 'name',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onSortByChange: () => {},
  },
};

export const SortedByExpiration: Story = {
  args: {
    searchQuery: '',
    statusFilter: 'all',
    sortBy: 'expiration',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onSortByChange: () => {},
  },
};
