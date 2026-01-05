// Context
export { RecommendedItemsContext } from './context';
export type { RecommendedItemsContextValue } from './context';

// Provider
export { RecommendedItemsProvider } from './provider';

// Hooks
export { useRecommendedItems } from './hooks';

// Data
export {
  RECOMMENDED_ITEMS,
  getRecommendedItemById,
  getRecommendedItemsByCategory,
} from './data';

// Components
export { TemplateSelector } from './components';
export type { TemplateSelectorProps } from './components';
