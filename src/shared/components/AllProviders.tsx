import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { SettingsProvider } from '@/features/settings';
import { CloudSyncProvider } from '@/features/cloudSync';
import { ThemeApplier } from '@/components/ThemeApplier';
import { HouseholdProvider } from '@/features/household';
import { RecommendedItemsProvider } from '@/features/templates';
import { InventoryProvider } from '@/features/inventory';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';
import { composeProviders } from '@/shared/utils/composeProviders';

/**
 * Wraps children with all app providers in the correct order.
 *
 * Provider nesting order (outermost to innermost):
 * 1. ErrorBoundary - Catches React errors
 * 2. SettingsProvider - Provides settings context (theme, language, etc.)
 * 3. CloudSyncProvider - Provides cloud sync functionality (requires SettingsProvider)
 * 4. ThemeApplier - Applies theme CSS variables (requires SettingsProvider)
 * 5. NotificationProvider - Provides notification context (must wrap InventoryProvider)
 * 6. HouseholdProvider - Provides household configuration
 * 7. RecommendedItemsProvider - Provides recommended item definitions
 * 8. InventoryProvider - Provides inventory items and categories (innermost)
 *
 * Used by Storybook stories and test utilities to provide consistent context.
 * Note: This order matches App.tsx for consistency (except DocumentMetadata is excluded).
 */
export const AllProviders = composeProviders([
  ErrorBoundary,
  SettingsProvider,
  CloudSyncProvider,
  ThemeApplier,
  NotificationProvider,
  HouseholdProvider,
  RecommendedItemsProvider,
  InventoryProvider,
]);
