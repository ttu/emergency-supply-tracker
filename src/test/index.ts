/**
 * Centralized test utilities for the Emergency Supply Tracker
 *
 * Import from '@/test' to get access to:
 * - renderWithProviders and convenience render functions
 * - i18next mock utilities
 * - Re-exported testing library utilities
 * - Factory functions for test data
 *
 * @example
 * import { renderWithProviders, screen, createMockInventoryItem } from '@/test';
 *
 * it('should render item', () => {
 *   const item = createMockInventoryItem({ name: 'Test' });
 *   renderWithProviders(<ItemCard item={item} />);
 *   expect(screen.getByText('Test')).toBeInTheDocument();
 * });
 */

// Render utilities
export {
  renderWithProviders,
  renderWithSettings,
  renderWithHousehold,
  renderWithInventory,
  renderWithAllProviders,
  type ProviderOptions,
  type RenderWithProvidersOptions,
} from './render';

// i18next mock utilities
export { defaultI18nMock, createI18nMock, type I18nMockOptions } from './i18n';

// Re-export testing library utilities for convenience
export {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
  cleanup,
} from '@testing-library/react';

// Re-export user-event
export { default as userEvent } from '@testing-library/user-event';

// Re-export factory functions from existing location
export {
  createMockHousehold,
  createMockSettings,
  createMockCategory,
  createMockInventoryItem,
  createMockProductTemplate,
  createMockAppData,
  createMockAlert,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
