import type { ComponentType, ReactNode } from 'react';

type ProviderComponent = ComponentType<{ children: ReactNode }>;

/**
 * Composes multiple provider components into a single wrapper.
 * Providers are applied from first to last (first is outermost).
 *
 * This eliminates the "pyramid of doom" when nesting multiple providers:
 *
 * @example
 * // Before (nested pyramid):
 * <ErrorBoundary>
 *   <SettingsProvider>
 *     <NotificationProvider>
 *       <InventoryProvider>
 *         <App />
 *       </InventoryProvider>
 *     </NotificationProvider>
 *   </SettingsProvider>
 * </ErrorBoundary>
 *
 * // After (flat array):
 * const AppProviders = composeProviders([
 *   ErrorBoundary,
 *   SettingsProvider,
 *   NotificationProvider,
 *   InventoryProvider,
 * ]);
 *
 * <AppProviders>
 *   <App />
 * </AppProviders>
 */
export function composeProviders(
  providers: ProviderComponent[],
): ComponentType<{ children: ReactNode }> {
  return function ComposedProviders({ children }: { children: ReactNode }) {
    return providers.reduceRight<ReactNode>(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children,
    );
  };
}
