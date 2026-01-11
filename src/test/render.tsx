/**
 * Centralized render utilities for testing with providers
 *
 * This module provides renderWithProviders and convenience functions
 * for rendering components within the app's provider hierarchy.
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { SettingsProvider } from '@/features/settings';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/features/inventory';
import { RecommendedItemsProvider } from '@/features/templates';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { ThemeApplier } from '@/components/ThemeApplier';
import type { AppData } from '@/shared/types';
import { createMockAppData } from '@/shared/utils/test/factories';
import { STORAGE_KEY } from '@/shared/utils/storage/localStorage';

/**
 * Options for configuring which providers to include
 */
export interface ProviderOptions {
  /**
   * Include SettingsProvider (language, theme, etc.)
   * @default true
   */
  settings?: boolean;

  /**
   * Include HouseholdProvider (adults, children, supply days)
   * @default true
   */
  household?: boolean;

  /**
   * Include RecommendedItemsProvider (recommended item definitions)
   * @default true
   */
  recommendedItems?: boolean;

  /**
   * Include InventoryProvider (items, categories, templates)
   * @default true
   */
  inventory?: boolean;

  /**
   * Include ErrorBoundary wrapper
   * @default false
   */
  errorBoundary?: boolean;

  /**
   * Include ThemeApplier (applies CSS variables based on settings)
   * @default false
   */
  themeApplier?: boolean;
}

/**
 * Options for renderWithProviders
 */
export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  'wrapper'
> {
  /**
   * Control which providers are included
   */
  providers?: ProviderOptions;

  /**
   * Initial data for localStorage
   * Will be merged with default mock data
   */
  initialAppData?: Partial<AppData>;

  /**
   * Custom wrapper component (for adding extra providers)
   */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * Renders a component with the app's provider hierarchy
 *
 * By default, includes: SettingsProvider, HouseholdProvider,
 * RecommendedItemsProvider, and InventoryProvider.
 *
 * @example
 * // Default usage - includes all standard providers
 * renderWithProviders(<Dashboard />);
 *
 * @example
 * // With initial data
 * renderWithProviders(<Dashboard />, {
 *   initialAppData: {
 *     household: { adults: 4, children: 2 },
 *     items: [createMockInventoryItem()],
 *   },
 * });
 *
 * @example
 * // With specific providers only
 * renderWithProviders(<HouseholdForm />, {
 *   providers: {
 *     settings: false,
 *     household: true,
 *     recommendedItems: false,
 *     inventory: false,
 *   },
 * });
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): ReturnType<typeof render> {
  const {
    providers = {},
    initialAppData,
    wrapper: CustomWrapper,
    ...renderOptions
  } = options;

  const {
    settings = true,
    household = true,
    recommendedItems = true,
    inventory = true,
    errorBoundary = false,
    themeApplier = false,
  } = providers;

  // Track if we set localStorage so we can clean it up
  const didSetLocalStorage = initialAppData !== undefined;

  // Setup localStorage if initial data provided
  if (didSetLocalStorage) {
    const data = createMockAppData(initialAppData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function AllProviders({ children }: { children: ReactNode }) {
    let wrapped: ReactNode = children;

    // Build provider tree from inside out (reverse order of nesting)
    // Order matches App.tsx: ErrorBoundary > Settings > ThemeApplier > NotificationProvider > Household > RecommendedItems > Inventory
    if (inventory) wrapped = <InventoryProvider>{wrapped}</InventoryProvider>;
    if (recommendedItems)
      wrapped = <RecommendedItemsProvider>{wrapped}</RecommendedItemsProvider>;
    if (household) wrapped = <HouseholdProvider>{wrapped}</HouseholdProvider>;
    // NotificationProvider must wrap InventoryProvider since InventoryProvider uses useNotification
    // Always include NotificationProvider in test utilities to ensure useNotification hook has a provider
    wrapped = <NotificationProvider>{wrapped}</NotificationProvider>;
    if (themeApplier) wrapped = <ThemeApplier>{wrapped}</ThemeApplier>;
    if (settings) wrapped = <SettingsProvider>{wrapped}</SettingsProvider>;
    if (errorBoundary) wrapped = <ErrorBoundary>{wrapped}</ErrorBoundary>;

    if (CustomWrapper) wrapped = <CustomWrapper>{wrapped}</CustomWrapper>;

    return <>{wrapped}</>;
  }

  const result = render(ui, { wrapper: AllProviders, ...renderOptions });

  // Wrap unmount to clean up localStorage when test completes
  const originalUnmount = result.unmount;
  result.unmount = () => {
    if (didSetLocalStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return originalUnmount();
  };

  return result;
}

/**
 * Renders a component with only SettingsProvider
 *
 * Useful for testing components that only need settings context
 * (e.g., language switchers, theme selectors)
 *
 * @example
 * renderWithSettings(<LanguageSelector />);
 */
export function renderWithSettings(
  ui: ReactElement,
  options?: Omit<RenderWithProvidersOptions, 'providers'>,
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    ...options,
    providers: {
      settings: true,
      household: false,
      recommendedItems: false,
      inventory: false,
    },
  });
}

/**
 * Renders a component with only HouseholdProvider
 *
 * Useful for testing components that only need household context
 * (e.g., household configuration forms)
 *
 * @example
 * renderWithHousehold(<HouseholdForm />);
 */
export function renderWithHousehold(
  ui: ReactElement,
  options?: Omit<RenderWithProvidersOptions, 'providers'>,
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    ...options,
    providers: {
      settings: false,
      household: true,
      recommendedItems: false,
      inventory: false,
    },
  });
}

/**
 * Renders a component with only InventoryProvider
 *
 * Useful for testing components that only need inventory context
 *
 * @example
 * renderWithInventory(<ItemList />);
 */
export function renderWithInventory(
  ui: ReactElement,
  options?: Omit<RenderWithProvidersOptions, 'providers'>,
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    ...options,
    providers: {
      settings: false,
      household: false,
      recommendedItems: false,
      inventory: true,
    },
  });
}

/**
 * Renders a component with all providers including ErrorBoundary and ThemeApplier
 *
 * Useful for integration tests that need the full app environment
 *
 * @example
 * renderWithAllProviders(<App />);
 */
export function renderWithAllProviders(
  ui: ReactElement,
  options?: Omit<RenderWithProvidersOptions, 'providers'>,
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    ...options,
    providers: {
      settings: true,
      household: true,
      recommendedItems: true,
      inventory: true,
      errorBoundary: true,
      themeApplier: true,
    },
  });
}
