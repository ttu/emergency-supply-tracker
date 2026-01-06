import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from './FilterBar';

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
});
