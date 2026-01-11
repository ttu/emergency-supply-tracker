import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { SettingsProvider } from '@/features/settings';
import { ThemeApplier } from '@/components/ThemeApplier';
import { HouseholdProvider } from '@/features/household';
import { RecommendedItemsProvider } from '@/features/templates';
import { InventoryProvider } from '@/features/inventory';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';

interface AllProvidersProps {
  readonly children: ReactNode;
}

/**
 * Wraps children with all app providers in the correct order.
 *
 * Provider nesting order (outermost to innermost):
 * 1. ErrorBoundary - Catches React errors
 * 2. SettingsProvider - Provides settings context (theme, language, etc.)
 * 3. ThemeApplier - Applies theme CSS variables (requires SettingsProvider)
 * 4. HouseholdProvider - Provides household configuration
 * 5. RecommendedItemsProvider - Provides recommended item definitions
 * 6. NotificationProvider - Provides notification context (must wrap InventoryProvider)
 * 7. InventoryProvider - Provides inventory items and categories (innermost)
 *
 * Used by Storybook stories and test utilities to provide consistent context.
 * Note: App.tsx has its own provider setup that matches this order.
 */
export function AllProviders({ children }: AllProvidersProps) {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeApplier>
          <HouseholdProvider>
            <RecommendedItemsProvider>
              <NotificationProvider>
                <InventoryProvider>{children}</InventoryProvider>
              </NotificationProvider>
            </RecommendedItemsProvider>
          </HouseholdProvider>
        </ThemeApplier>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
