import type {
  RecommendedItemsFile,
  ImportedRecommendedItem,
} from '../../../types';
import { createProductTemplateId, createQuantity } from '../../../types';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';

export function createValidFile(
  overrides?: Partial<RecommendedItemsFile>,
): RecommendedItemsFile {
  return {
    meta: {
      name: 'Test Kit',
      version: CURRENT_SCHEMA_VERSION,
      createdAt: '2025-01-01T00:00:00.000Z',
      ...overrides?.meta,
    },
    items: overrides?.items ?? [
      {
        id: createProductTemplateId('test-item'),
        names: { en: 'Test Item' },
        category: 'food',
        baseQuantity: createQuantity(1),
        unit: 'pieces',
        scaleWithPeople: true,
        scaleWithDays: false,
      },
    ],
  };
}

export function createValidItem(
  overrides?: Partial<ImportedRecommendedItem>,
): ImportedRecommendedItem {
  return {
    id: createProductTemplateId('test-item'),
    names: { en: 'Test Item' },
    category: 'food',
    baseQuantity: createQuantity(1),
    unit: 'pieces',
    scaleWithPeople: true,
    scaleWithDays: false,
    ...overrides,
  };
}
