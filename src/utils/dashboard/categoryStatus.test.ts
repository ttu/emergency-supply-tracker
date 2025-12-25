import {
  calculateCategoryStatus,
  calculateAllCategoryStatuses,
} from './categoryStatus';
import type { Category, InventoryItem } from '../../types';

describe('calculateCategoryStatus', () => {
  const waterCategory: Category = {
    id: 'water',
    name: 'Water',
    icon: '💧',
  };

  it('should calculate status for empty category', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 0);

    expect(result).toEqual({
      categoryId: 'water',
      categoryName: 'Water',
      itemCount: 0,
      status: 'critical',
      completionPercentage: 0,
      criticalCount: 0,
      warningCount: 0,
      okCount: 0,
    });
  });

  it('should return critical status when completion < 30%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 25);

    expect(result.status).toBe('critical');
    expect(result.completionPercentage).toBe(25);
  });

  it('should return warning status when completion between 30-70%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 50);

    expect(result.status).toBe('warning');
    expect(result.completionPercentage).toBe(50);
  });

  it('should return ok status when completion >= 70%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 80);

    expect(result.status).toBe('ok');
    expect(result.completionPercentage).toBe(80);
  });

  it('should count items by status correctly', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 0,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
      {
        id: '2',
        name: 'Water Bottles',
        categoryId: 'water',
        quantity: 10,
        unit: 'bottles',
        recommendedQuantity: 24,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
      {
        id: '3',
        name: 'Water Purification',
        categoryId: 'water',
        quantity: 5,
        unit: 'tablets',
        recommendedQuantity: 5,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const result = calculateCategoryStatus(waterCategory, items, 60);

    expect(result.itemCount).toBe(3);
    expect(result.criticalCount).toBeGreaterThanOrEqual(0);
    expect(result.warningCount).toBeGreaterThanOrEqual(0);
    expect(result.okCount).toBeGreaterThanOrEqual(0);
    expect(result.criticalCount + result.warningCount + result.okCount).toBe(3);
  });

  it('should override to critical if any items are critical', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 0,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: true,
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const result = calculateCategoryStatus(waterCategory, items, 20);
    expect(result.status).toBe('critical');
    expect(result.criticalCount).toBe(1);
  });

  it('should only count items from the specified category', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 28,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
      {
        id: '2',
        name: 'Food',
        categoryId: 'food',
        quantity: 10,
        unit: 'cans',
        recommendedQuantity: 10,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const result = calculateCategoryStatus(waterCategory, items, 100);
    expect(result.itemCount).toBe(1);
  });
});

describe('calculateAllCategoryStatuses', () => {
  const categories: Category[] = [
    { id: 'water', name: 'Water', icon: '💧' },
    { id: 'food', name: 'Food', icon: '🥫' },
    { id: 'medical', name: 'Medical', icon: '⚕️' },
  ];

  it('should calculate status for all categories', () => {
    const items: InventoryItem[] = [];
    const preparedness = new Map<string, number>([
      ['water', 80],
      ['food', 50],
      ['medical', 20],
    ]);

    const results = calculateAllCategoryStatuses(
      categories,
      items,
      preparedness,
    );

    expect(results).toHaveLength(3);
    expect(results[0].categoryId).toBe('water');
    expect(results[1].categoryId).toBe('food');
    expect(results[2].categoryId).toBe('medical');
  });

  it('should use 0 as default preparedness if not in map', () => {
    const items: InventoryItem[] = [];
    const preparedness = new Map<string, number>([['water', 80]]);

    const results = calculateAllCategoryStatuses(
      categories,
      items,
      preparedness,
    );

    expect(results[0].completionPercentage).toBe(80);
    expect(results[1].completionPercentage).toBe(0);
    expect(results[2].completionPercentage).toBe(0);
  });

  it('should return empty array for no categories', () => {
    const items: InventoryItem[] = [];
    const preparedness = new Map<string, number>();

    const results = calculateAllCategoryStatuses([], items, preparedness);

    expect(results).toHaveLength(0);
  });
});
