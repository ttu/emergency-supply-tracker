import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocationSuggestions } from './useLocationSuggestions';
import { createMockInventoryItem } from '@/test';
import { createItemId, createCategoryId, createQuantity } from '@/shared/types';

describe('useLocationSuggestions', () => {
  it('should return empty array when no items', () => {
    const { result } = renderHook(() => useLocationSuggestions([]));
    expect(result.current).toEqual([]);
  });

  it('should return empty array when items have no locations', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Item 2',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        location: undefined,
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    expect(result.current).toEqual([]);
  });

  it('should filter out empty string locations', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: '',
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Item 2',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        location: 'Kitchen',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    expect(result.current).toEqual(['Kitchen']);
  });

  it('should filter out whitespace-only locations', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: '   ',
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Item 2',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        location: 'Garage',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    expect(result.current).toEqual(['Garage']);
  });

  it('should trim locations and deduplicate', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: '  Kitchen  ',
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Item 2',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        location: 'Kitchen',
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Item 3',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(3),
        location: 'Kitchen ',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    expect(result.current).toEqual(['Kitchen']);
  });

  it('should return unique locations sorted alphabetically (case-insensitive)', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: 'Garage',
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Item 2',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        location: 'kitchen',
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Item 3',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(3),
        location: 'Basement',
      }),
      createMockInventoryItem({
        id: createItemId('4'),
        name: 'Item 4',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(4),
        location: 'Kitchen',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    // Should be sorted: Basement, Garage, kitchen, Kitchen
    // But Kitchen and kitchen are different (not deduped unless trimmed case matches)
    expect(result.current).toEqual([
      'Basement',
      'Garage',
      'kitchen',
      'Kitchen',
    ]);
  });

  it('should deduplicate identical locations', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: 'Kitchen',
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Item 2',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        location: 'Kitchen',
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Item 3',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(3),
        location: 'Garage',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    expect(result.current).toEqual(['Garage', 'Kitchen']);
  });

  it('should handle mixed undefined and valid locations', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: undefined,
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Item 2',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        location: 'Pantry',
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Item 3',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(3),
        location: '',
      }),
      createMockInventoryItem({
        id: createItemId('4'),
        name: 'Item 4',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(4),
        location: 'Cellar',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    expect(result.current).toEqual(['Cellar', 'Pantry']);
  });
});
