import type { ReactNode } from 'react';
import { SettingsProvider } from '@/features/settings';
import { HouseholdProvider } from '@/features/household';
import { RecommendedItemsProvider } from '@/features/templates';
import { InventoryProvider } from '@/features/inventory';

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wraps children with all app providers in the correct order.
 * Used by Storybook stories and test utilities to provide consistent context.
 */
export function AllProviders({ children }: AllProvidersProps) {
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
