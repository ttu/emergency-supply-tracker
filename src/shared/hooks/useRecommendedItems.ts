import { useContext } from 'react';
import { RecommendedItemsContext } from '../contexts/RecommendedItemsContext';

export function useRecommendedItems() {
  const context = useContext(RecommendedItemsContext);
  if (!context) {
    throw new Error(
      'useRecommendedItems must be used within RecommendedItemsProvider',
    );
  }
  return context;
}
