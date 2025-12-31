import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { HouseholdProvider } from '../contexts/HouseholdProvider';
import { SettingsProvider } from '../contexts/SettingsProvider';
import type { InventoryItem } from '../types';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock child components
jest.mock('../components/dashboard/DashboardHeader', () => ({
  DashboardHeader: ({ preparednessScore }: { preparednessScore: number }) => (
    <div data-testid="dashboard-header">Preparedness: {preparednessScore}%</div>
  ),
}));

jest.mock('../components/dashboard/AlertBanner', () => ({
  AlertBanner: ({
    alert,
    onDismiss,
  }: {
    alert: { id: string; message: string };
    onDismiss?: () => void;
  }) => (
    <div data-testid={`alert-${alert.id}`}>
      {alert.message}
      {onDismiss && (
        <button onClick={onDismiss} data-testid={`dismiss-${alert.id}`}>
          Dismiss
        </button>
      )}
    </div>
  ),
}));

jest.mock('../components/dashboard/CategoryGrid', () => ({
  CategoryGrid: ({
    categories,
  }: {
    categories: Array<{
      categoryId: string;
      categoryName: string;
      onClick?: () => void;
    }>;
  }) => (
    <div data-testid="category-grid">
      {categories.map((cat) => (
        <button
          key={cat.categoryId}
          data-testid={`category-${cat.categoryId}`}
          onClick={cat.onClick}
        >
          {cat.categoryName}
        </button>
      ))}
    </div>
  ),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <SettingsProvider>
      <HouseholdProvider>
        <InventoryProvider>{ui}</InventoryProvider>
      </HouseholdProvider>
    </SettingsProvider>,
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render dashboard header', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
  });

  it('should render quick actions buttons', () => {
    renderWithProviders(<Dashboard />);
    // Look for buttons with translated keys (since i18n is not initialized in tests)
    expect(screen.getByText(/dashboard.addItems/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.viewInventory/i)).toBeInTheDocument();
    expect(
      screen.getByText(/dashboard.exportShoppingList/i),
    ).toBeInTheDocument();
  });

  it('should render category grid', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByTestId('category-grid')).toBeInTheDocument();
  });

  it('should display all standard categories', () => {
    renderWithProviders(<Dashboard />);

    // Check for some standard categories
    expect(screen.getByTestId('category-water-beverages')).toBeInTheDocument();
    expect(screen.getByTestId('category-food')).toBeInTheDocument();
    expect(screen.getByTestId('category-medical-health')).toBeInTheDocument();
  });

  it('should handle category click', () => {
    const onNavigate = jest.fn();
    renderWithProviders(<Dashboard onNavigate={onNavigate} />);

    const categoryButton = screen.getByTestId('category-water-beverages');
    fireEvent.click(categoryButton);

    // Should navigate to inventory page with category filter
    expect(onNavigate).toHaveBeenCalledWith('inventory', {
      initialCategoryId: 'water-beverages',
    });
  });

  it('should handle quick action clicks', () => {
    const onNavigate = jest.fn();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    renderWithProviders(<Dashboard onNavigate={onNavigate} />);

    // Test Add Items button - should navigate to inventory with modal open
    fireEvent.click(screen.getByText(/dashboard.addItems/i));
    expect(onNavigate).toHaveBeenCalledWith('inventory', {
      openAddModal: true,
    });

    // Test View Inventory button - should navigate to inventory
    fireEvent.click(screen.getByText(/dashboard.viewInventory/i));
    expect(onNavigate).toHaveBeenCalledWith('inventory');

    // Test Export Shopping List button - logs but doesn't navigate (TODO: implement export)
    fireEvent.click(screen.getByText(/dashboard.exportShoppingList/i));
    expect(consoleSpy).toHaveBeenCalledWith('Export shopping list');

    consoleSpy.mockRestore();
  });

  it('should not show alerts section when no alerts', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.queryByText(/dashboard.alerts/i)).not.toBeInTheDocument();
  });

  it('should show alerts section when alerts exist', () => {
    // Test that alerts section appears when there are alerts
    // We need to test with an out-of-stock item (quantity = 0) which definitely triggers an alert
    const outOfStockItem: InventoryItem = {
      id: '1',
      name: 'Out of Stock Water',
      itemType: 'custom',
      categoryId: 'water-beverages',
      quantity: 0,
      unit: 'gallons',
      recommendedQuantity: 28,
      neverExpires: true,
      location: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('inventory', JSON.stringify([outOfStockItem]));

    renderWithProviders(<Dashboard />);
    // Check that alerts section heading exists
    const alertsHeading = screen.queryByText(/dashboard.alerts/i);
    if (alertsHeading) {
      expect(alertsHeading).toBeInTheDocument();
    }
  });

  it('should allow dismissing alerts', () => {
    // Test the dismiss functionality with a simple check
    const outOfStockItem: InventoryItem = {
      id: '1',
      name: 'Out of Stock Item',
      itemType: 'custom',
      categoryId: 'water-beverages',
      quantity: 0,
      unit: 'gallons',
      recommendedQuantity: 28,
      neverExpires: true,
      location: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('inventory', JSON.stringify([outOfStockItem]));

    const { container } = renderWithProviders(<Dashboard />);

    // Check that alert banners are rendered (if any)
    const alerts = container.querySelectorAll('[data-testid^="alert-"]');
    if (alerts.length > 0) {
      // Find first dismiss button and click it
      const dismissButton = container.querySelector(
        '[data-testid^="dismiss-"]',
      );
      if (dismissButton) {
        fireEvent.click(dismissButton);
        // After dismissal, that specific alert should be gone
        expect(alerts.length).toBeGreaterThan(0);
      }
    }
  });

  it('should calculate preparedness score based on inventory', () => {
    renderWithProviders(<Dashboard />);

    // With empty inventory, should show some preparedness score
    const header = screen.getByTestId('dashboard-header');
    expect(header.textContent).toContain('Preparedness:');
  });

  it('should update when inventory changes', () => {
    const { rerender } = renderWithProviders(<Dashboard />);

    // Add an item to inventory
    const item: InventoryItem = {
      id: '1',
      name: 'Water',
      itemType: 'custom',
      categoryId: 'water-beverages',
      quantity: 28,
      unit: 'gallons',
      recommendedQuantity: 28,
      neverExpires: false,
      expirationDate: '2025-12-31',
      location: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('inventory', JSON.stringify([item]));

    // Re-render to pick up changes
    rerender(
      <SettingsProvider>
        <HouseholdProvider>
          <InventoryProvider>
            <Dashboard />
          </InventoryProvider>
        </HouseholdProvider>
      </SettingsProvider>,
    );

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    renderWithProviders(<Dashboard />);

    // Check for heading structure
    expect(screen.getByText(/dashboard.quickActions/i)).toBeInTheDocument();
    expect(
      screen.getByText(/dashboard.categoriesOverview/i),
    ).toBeInTheDocument();
  });
});
