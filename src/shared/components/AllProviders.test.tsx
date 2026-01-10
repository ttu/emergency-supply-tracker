import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllProviders } from './AllProviders';

// Mock the providers to avoid needing full context setup
vi.mock('@/features/settings', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-provider">{children}</div>
  ),
}));

vi.mock('@/features/household', () => ({
  HouseholdProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="household-provider">{children}</div>
  ),
}));

vi.mock('@/features/templates', () => ({
  RecommendedItemsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recommended-items-provider">{children}</div>
  ),
}));

vi.mock('@/features/inventory', () => ({
  InventoryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="inventory-provider">{children}</div>
  ),
}));

describe('AllProviders', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render children with all providers in correct order', () => {
    render(
      <AllProviders>
        <div data-testid="child-content">Test Content</div>
      </AllProviders>,
    );

    // Verify child content is rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Verify all providers are present in correct nesting order
    // Order should be: Settings > Household > RecommendedItems > Inventory
    const settingsProvider = screen.getByTestId('settings-provider');
    const householdProvider = screen.getByTestId('household-provider');
    const recommendedItemsProvider = screen.getByTestId(
      'recommended-items-provider',
    );
    const inventoryProvider = screen.getByTestId('inventory-provider');

    expect(settingsProvider).toBeInTheDocument();
    expect(householdProvider).toBeInTheDocument();
    expect(recommendedItemsProvider).toBeInTheDocument();
    expect(inventoryProvider).toBeInTheDocument();

    // Verify nesting order: child should be inside inventory, which is inside recommended items, etc.
    expect(inventoryProvider).toContainElement(
      screen.getByTestId('child-content'),
    );
    expect(recommendedItemsProvider).toContainElement(inventoryProvider);
    expect(householdProvider).toContainElement(recommendedItemsProvider);
    expect(settingsProvider).toContainElement(householdProvider);
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
    expect(screen.getByTestId('settings-provider')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });
});
