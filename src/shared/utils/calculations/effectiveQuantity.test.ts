import { describe, it, expect } from 'vitest';
import { getEffectiveQuantity } from './effectiveQuantity';
import type { InventoryItem } from '@/shared/types';
import { createItemId, createCategoryId } from '@/shared/types';

const createTestItem = (
  overrides: Partial<InventoryItem> = {},
): InventoryItem => ({
  id: createItemId('test-1'),
  name: 'Test Item',
  itemType: 'custom',
  categoryId: createCategoryId('food'),
  quantity: 5,
  unit: 'pieces',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('getEffectiveQuantity', () => {
  it('should return quantity for regular items', () => {
    const item = createTestItem({ quantity: 10 });
    expect(getEffectiveQuantity(item)).toBe(10);
  });

  it('should return estimatedQuantity for rotation items', () => {
    const item = createTestItem({
      quantity: 3,
      isNormalRotation: true,
      estimatedQuantity: 5,
    });
    expect(getEffectiveQuantity(item)).toBe(5);
  });

  it('should return 0 for excluded rotation items', () => {
    const item = createTestItem({
      quantity: 3,
      isNormalRotation: true,
      estimatedQuantity: 5,
      excludeFromCalculations: true,
    });
    expect(getEffectiveQuantity(item)).toBe(0);
  });

  it('should return 0 for rotation items without estimatedQuantity', () => {
    const item = createTestItem({
      quantity: 3,
      isNormalRotation: true,
    });
    expect(getEffectiveQuantity(item)).toBe(0);
  });
});
