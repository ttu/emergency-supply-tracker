import { describe, it, expect } from 'vitest';
import type { InventoryItem } from './index';
import { createItemId, createCategoryId, createQuantity } from './index';

describe('InventoryItem rotation fields', () => {
  it('should allow isNormalRotation field', () => {
    const item: InventoryItem = {
      id: createItemId('test-1'),
      name: 'Flour',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: createQuantity(0),
      unit: 'kilograms',
      isNormalRotation: true,
      estimatedQuantity: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(item.isNormalRotation).toBe(true);
    expect(item.estimatedQuantity).toBe(2);
  });

  it('should allow excludeFromCalculations field for rotation items', () => {
    const item: InventoryItem = {
      id: createItemId('test-2'),
      name: 'Toilet Paper',
      itemType: 'custom',
      categoryId: createCategoryId('hygiene-sanitation'),
      quantity: createQuantity(0),
      unit: 'rolls',
      isNormalRotation: true,
      excludeFromCalculations: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(item.excludeFromCalculations).toBe(true);
  });
});
