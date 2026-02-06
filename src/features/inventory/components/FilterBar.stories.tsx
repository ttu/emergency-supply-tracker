import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterBar } from './FilterBar';

const sampleLocations = ['Kitchen pantry', 'Garage shelf', 'Basement storage'];

const meta = {
  title: 'Components/Inventory/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSearchChange: { action: 'search changed' },
    onStatusFilterChange: { action: 'status filter changed' },
    onLocationFilterChange: { action: 'location filter changed' },
    onSortByChange: { action: 'sort changed' },
  },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    searchQuery: '',
    statusFilter: 'all',
    locationFilter: 'all',
    locations: sampleLocations,
    sortBy: 'name',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onLocationFilterChange: () => {},
    onSortByChange: () => {},
  },
};

export const WithSearch: Story = {
  args: {
    searchQuery: 'water',
    statusFilter: 'all',
    locationFilter: 'all',
    locations: sampleLocations,
    sortBy: 'name',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onLocationFilterChange: () => {},
    onSortByChange: () => {},
  },
};

export const FilteredByCritical: Story = {
  args: {
    searchQuery: '',
    statusFilter: 'critical',
    locationFilter: 'all',
    locations: sampleLocations,
    sortBy: 'name',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onLocationFilterChange: () => {},
    onSortByChange: () => {},
  },
};

export const FilteredByLocation: Story = {
  args: {
    searchQuery: '',
    statusFilter: 'all',
    locationFilter: 'Kitchen pantry',
    locations: sampleLocations,
    sortBy: 'name',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onLocationFilterChange: () => {},
    onSortByChange: () => {},
  },
};

export const SortedByExpiration: Story = {
  args: {
    searchQuery: '',
    statusFilter: 'all',
    locationFilter: 'all',
    locations: sampleLocations,
    sortBy: 'expiration',
    onSearchChange: () => {},
    onStatusFilterChange: () => {},
    onLocationFilterChange: () => {},
    onSortByChange: () => {},
  },
};
