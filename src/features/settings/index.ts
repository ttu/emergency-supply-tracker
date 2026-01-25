// Context
export { SettingsContext } from './context';
export type { SettingsContextValue } from './context';

// Provider
export { SettingsProvider } from './provider';

// Hooks
export { useSettings, useShoppingListExport } from './hooks';
export type { UseShoppingListExportResult } from './hooks';

// Components
export {
  ClearDataButton,
  DebugExport,
  DisabledCategories,
  DisabledRecommendations,
  ExportButton,
  HouseholdForm,
  ImportButton,
  KitManagement,
  LanguageSelector,
  NutritionSettings,
  OverriddenRecommendations,
  ShoppingListExport,
  ThemeSelector,
} from './components';

// Factories
export {
  UserSettingsFactory,
  UserSettingsValidationError,
} from './factories/UserSettingsFactory';
export type { CreateUserSettingsInput } from './factories/UserSettingsFactory';

// Pages
export { Settings } from './pages/Settings';
