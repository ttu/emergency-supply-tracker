/* eslint-disable react-refresh/only-export-components */
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/features/inventory';
import { SettingsProvider } from '@/features/settings';
import { RecommendedItemsProvider } from '@/features/templates';

/**
 * Shared test wrapper that provides all necessary context providers.
 * Use this to render components that depend on app-level providers.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <HouseholdProvider>
        <RecommendedItemsProvider>
          <InventoryProvider>{children}</InventoryProvider>
        </RecommendedItemsProvider>
      </HouseholdProvider>
    </SettingsProvider>
  );
}

/**
 * Custom render function that wraps components with all app providers.
 * Use this instead of @testing-library/react's render for integration tests.
 *
 * @example
 * ```tsx
 * import { renderWithProviders, screen } from '@/shared/utils/test/render';
 *
 * it('should render component', () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';
