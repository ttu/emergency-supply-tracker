import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FilterBar,
  LOCATION_FILTER_ALL,
  LOCATION_FILTER_NONE,
} from './FilterBar';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('FilterBar', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    statusFilter: 'all' as const,
    onStatusFilterChange: vi.fn(),
    locationFilter: LOCATION_FILTER_ALL,
    onLocationFilterChange: vi.fn(),
    locations: ['Kitchen', 'Garage', 'Basement'],
    sortBy: 'name' as const,
    onSortByChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(<FilterBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('should render status filter dropdown', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByText('inventory.filter.status')).toBeInTheDocument();
  });

  it('should render sort dropdown', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByText('inventory.sort.label')).toBeInTheDocument();
  });

  it('should call onSearchChange when typing in search input', () => {
    render(<FilterBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    fireEvent.change(searchInput, { target: { value: 'water' } });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('water');
  });

  it('should display current search query', () => {
    render(<FilterBar {...defaultProps} searchQuery="test query" />);

    const searchInput = screen.getByDisplayValue('test query');
    expect(searchInput).toBeInTheDocument();
  });

  it('should call onStatusFilterChange when changing status filter', () => {
    render(<FilterBar {...defaultProps} />);

    const statusSelect = screen.getByLabelText('inventory.filter.status');
    fireEvent.change(statusSelect, { target: { value: 'critical' } });

    expect(defaultProps.onStatusFilterChange).toHaveBeenCalledWith('critical');
  });

  it('should call onSortByChange when changing sort option', () => {
    render(<FilterBar {...defaultProps} />);

    const sortSelect = screen.getByLabelText('inventory.sort.label');
    fireEvent.change(sortSelect, { target: { value: 'expiration' } });

    expect(defaultProps.onSortByChange).toHaveBeenCalledWith('expiration');
  });

  it('should display current filter values', () => {
    render(
      <FilterBar {...defaultProps} statusFilter="warning" sortBy="quantity" />,
    );

    const statusSelect = screen.getByDisplayValue('status.warning');
    const sortSelect = screen.getByDisplayValue('inventory.sort.quantity');

    expect(statusSelect).toBeInTheDocument();
    expect(sortSelect).toBeInTheDocument();
  });

  it('should render location filter dropdown', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByText('inventory.filter.location')).toBeInTheDocument();
  });

  it('should call onLocationFilterChange when changing location filter', () => {
    render(<FilterBar {...defaultProps} />);

    const locationSelect = screen.getByLabelText('inventory.filter.location');
    fireEvent.change(locationSelect, { target: { value: 'Kitchen' } });

    expect(defaultProps.onLocationFilterChange).toHaveBeenCalledWith('Kitchen');
  });

  it('should display location options from props', () => {
    render(<FilterBar {...defaultProps} />);

    const locationSelect = screen.getByLabelText('inventory.filter.location');
    expect(locationSelect).toContainHTML('Kitchen');
    expect(locationSelect).toContainHTML('Garage');
    expect(locationSelect).toContainHTML('Basement');
  });

  it('should include "all" and "none" options in location filter', () => {
    render(<FilterBar {...defaultProps} />);

    const locationSelect = screen.getByLabelText('inventory.filter.location');
    expect(locationSelect).toContainHTML('inventory.filter.allLocations');
    expect(locationSelect).toContainHTML('inventory.filter.noLocation');
  });

  it('should call onLocationFilterChange with none when selecting no location', () => {
    render(<FilterBar {...defaultProps} />);

    const locationSelect = screen.getByLabelText('inventory.filter.location');
    fireEvent.change(locationSelect, {
      target: { value: LOCATION_FILTER_NONE },
    });

    expect(defaultProps.onLocationFilterChange).toHaveBeenCalledWith(
      LOCATION_FILTER_NONE,
    );
  });

  it('should display current location filter value', () => {
    render(<FilterBar {...defaultProps} locationFilter="Kitchen" />);

    const locationSelect = screen.getByDisplayValue('Kitchen');
    expect(locationSelect).toBeInTheDocument();
  });
});
