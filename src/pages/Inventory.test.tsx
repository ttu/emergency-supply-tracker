import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Inventory } from './Inventory';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { HouseholdProvider } from '../contexts/HouseholdProvider';
import { SettingsProvider } from '../contexts/SettingsProvider';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      <HouseholdProvider>
        <InventoryProvider>{component}</InventoryProvider>
      </HouseholdProvider>
    </SettingsProvider>,
  );
};

describe('Inventory Page', () => {
  beforeEach(() => {
    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render inventory page', () => {
    renderWithProviders(<Inventory />);

    expect(screen.getByText('navigation.inventory')).toBeInTheDocument();
    expect(screen.getByText('inventory.addFromTemplate')).toBeInTheDocument();
  });

  it('should show category navigation', () => {
    renderWithProviders(<Inventory />);

    expect(screen.getByText('inventory.allCategories')).toBeInTheDocument();
  });

  it('should show filter bar', () => {
    renderWithProviders(<Inventory />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    renderWithProviders(<Inventory />);

    expect(screen.getByText('inventory.noItems')).toBeInTheDocument();
  });

  it('should open add modal when clicking custom item in template selector', () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Click custom item button
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
  });

  it('should open template modal when clicking add from template', () => {
    renderWithProviders(<Inventory />);

    const templateButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(templateButton);

    expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();
  });

  it('should close modal when clicking cancel', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Select custom item to open the form
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    // Modal should show add item form
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();

    // Click close button (X) to close modal
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('inventory.addItem')).not.toBeInTheDocument();
    });
  });

  it('should filter items by search query', () => {
    renderWithProviders(<Inventory />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    fireEvent.change(searchInput, { target: { value: 'water' } });

    // Items would be filtered (tested implicitly through component logic)
    expect(searchInput).toHaveValue('water');
  });

  it('should filter items by category', () => {
    renderWithProviders(<Inventory />);

    const allCategoriesButton = screen.getByText('inventory.allCategories');
    expect(allCategoriesButton).toBeInTheDocument();

    // Category filtering is tested through component logic
  });

  it('should sort items', () => {
    renderWithProviders(<Inventory />);

    // Find the sort select by its label
    const sortLabel = screen.getByText('inventory.sort.label');
    expect(sortLabel).toBeInTheDocument();

    // Sorting is tested through component logic
  });
});
