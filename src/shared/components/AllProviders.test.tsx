import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllProviders } from './AllProviders';
import { useSettings } from '@/features/settings';
import { useHousehold } from '@/features/household';
import { useInventory } from '@/features/inventory';

// Track provider instances to detect duplicates
const providerInstances = {
  errorBoundary: 0,
  settings: 0,
  themeApplier: 0,
  household: 0,
  recommendedItems: 0,
  inventory: 0,
};

// Mock the providers to avoid needing full context setup
vi.mock('@/shared/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => {
    providerInstances.errorBoundary++;
    return <div data-testid="error-boundary">{children}</div>;
  },
}));

vi.mock('@/components/ThemeApplier', () => ({
  ThemeApplier: ({ children }: { children: React.ReactNode }) => {
    providerInstances.themeApplier++;
    return <div data-testid="theme-applier">{children}</div>;
  },
}));

vi.mock('@/features/settings', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => {
    providerInstances.settings++;
    return <div data-testid="settings-provider">{children}</div>;
  },
  useSettings: vi.fn(() => ({
    settings: { theme: 'light', language: 'en' },
    updateSettings: vi.fn(),
  })),
}));

vi.mock('@/features/household', () => ({
  HouseholdProvider: ({ children }: { children: React.ReactNode }) => {
    providerInstances.household++;
    return <div data-testid="household-provider">{children}</div>;
  },
  useHousehold: vi.fn(() => ({
    household: { adults: 1, children: 0, supplyDurationDays: 3 },
    updateHousehold: vi.fn(),
  })),
}));

vi.mock('@/features/templates', () => ({
  RecommendedItemsProvider: ({ children }: { children: React.ReactNode }) => {
    providerInstances.recommendedItems++;
    return <div data-testid="recommended-items-provider">{children}</div>;
  },
}));

vi.mock('@/features/inventory', () => ({
  InventoryProvider: ({ children }: { children: React.ReactNode }) => {
    providerInstances.inventory++;
    return <div data-testid="inventory-provider">{children}</div>;
  },
  useInventory: vi.fn(() => ({
    items: [],
    addItems: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  })),
}));

describe('AllProviders', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset provider instance counts before each test
    Object.keys(providerInstances).forEach(
      (key) => (providerInstances[key as keyof typeof providerInstances] = 0),
    );
  });

  it('should render children with all providers in correct nesting order', () => {
    render(
      <AllProviders>
        <div data-testid="child-content">Test Content</div>
      </AllProviders>,
    );

    // Verify child content is rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Verify all providers are present
    const errorBoundary = screen.getByTestId('error-boundary');
    const settingsProvider = screen.getByTestId('settings-provider');
    const themeApplier = screen.getByTestId('theme-applier');
    const householdProvider = screen.getByTestId('household-provider');
    const recommendedItemsProvider = screen.getByTestId(
      'recommended-items-provider',
    );
    const inventoryProvider = screen.getByTestId('inventory-provider');

    expect(errorBoundary).toBeInTheDocument();
    expect(settingsProvider).toBeInTheDocument();
    expect(themeApplier).toBeInTheDocument();
    expect(householdProvider).toBeInTheDocument();
    expect(recommendedItemsProvider).toBeInTheDocument();
    expect(inventoryProvider).toBeInTheDocument();

    // Verify nesting order (innermost to outermost):
    // child -> inventory -> recommendedItems -> household -> themeApplier -> settings -> errorBoundary
    expect(inventoryProvider).toContainElement(
      screen.getByTestId('child-content'),
    );
    expect(recommendedItemsProvider).toContainElement(inventoryProvider);
    expect(householdProvider).toContainElement(recommendedItemsProvider);
    expect(themeApplier).toContainElement(householdProvider);
    expect(settingsProvider).toContainElement(themeApplier);
    expect(errorBoundary).toContainElement(settingsProvider);
  });

  it('should not create duplicate provider instances', () => {
    render(
      <AllProviders>
        <div data-testid="child-content">Test Content</div>
      </AllProviders>,
    );

    // Each provider should be instantiated exactly once
    expect(providerInstances.errorBoundary).toBe(1);
    expect(providerInstances.settings).toBe(1);
    expect(providerInstances.themeApplier).toBe(1);
    expect(providerInstances.household).toBe(1);
    expect(providerInstances.recommendedItems).toBe(1);
    expect(providerInstances.inventory).toBe(1);
  });

  it('should make all contexts accessible to children', () => {
    function TestComponent() {
      const settings = useSettings();
      const household = useHousehold();
      const inventory = useInventory();

      return (
        <div data-testid="test-component">
          <div data-testid="settings-accessible">
            {settings ? 'settings-ok' : 'settings-missing'}
          </div>
          <div data-testid="household-accessible">
            {household ? 'household-ok' : 'household-missing'}
          </div>
          <div data-testid="inventory-accessible">
            {inventory ? 'inventory-ok' : 'inventory-missing'}
          </div>
        </div>
      );
    }

    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>,
    );

    // All contexts should be accessible
    expect(screen.getByTestId('settings-accessible')).toHaveTextContent(
      'settings-ok',
    );
    expect(screen.getByTestId('household-accessible')).toHaveTextContent(
      'household-ok',
    );
    expect(screen.getByTestId('inventory-accessible')).toHaveTextContent(
      'inventory-ok',
    );
  });

  it('should handle multiple children', () => {
    render(
      <AllProviders>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </AllProviders>,
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    const { container } = render(<AllProviders>{null}</AllProviders>);

    // Should still render providers even with null children
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('settings-provider')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });
});
