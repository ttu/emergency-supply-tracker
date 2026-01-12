// Context
export { InventoryContext } from './context';
export type { InventoryContextValue } from './context';

// Provider
export { InventoryProvider } from './provider';

// Hooks
export { useInventory } from './hooks';

// Factories
export {
  InventoryItemFactory,
  InventoryItemValidationError,
} from './factories/InventoryItemFactory';
export type {
  CreateItemInput,
  CreateFromTemplateOptions,
  CreateFromFormInput,
} from './factories/InventoryItemFactory';

// Components
export {
  ItemCard,
  ItemList,
  ItemForm,
  CategoryNav,
  FilterBar,
  CategoryStatusSummary,
} from './components';

export type {
  ItemCardProps,
  ItemListProps,
  ItemFormProps,
  CategoryNavProps,
  FilterBarProps,
  CategoryStatusSummaryProps,
  CategoryShortage,
} from './components';

// Pages
export { Inventory } from './pages/Inventory';
export type { InventoryProps } from './pages/Inventory';
