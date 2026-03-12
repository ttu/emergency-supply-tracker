import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocationSuggestions } from './useLocationSuggestions';
import { createMockInventoryItem } from '@/test';
import { createItemId, createCategoryId, createQuantity } from '@/shared/types';

describe('useLocationSuggestions - mutation killing tests', () => {
  it('should filter empty strings (L12: loc !== "" cannot be replaced with true or "Stryker was here!")', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: '',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    // Empty string must be filtered out - if condition is always true, '' would appear
    expect(result.current).toEqual([]);
    expect(result.current).not.toContain('');
    expect(result.current).not.toContain('Stryker was here!');
  });

  it('should sort case-insensitively using toLowerCase (L15: a.toUpperCase would break sort)', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: 'banana',
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Item 2',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        location: 'Apple',
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Item 3',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(3),
        location: 'cherry',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    // Case-insensitive sort: Apple < banana < cherry
    expect(result.current).toEqual(['Apple', 'banana', 'cherry']);
  });

  it('should return non-empty array when valid locations exist (L17: [] mutant)', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item 1',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        location: 'Kitchen',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    // Must not return [] when there are valid locations
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current).toEqual(['Kitchen']);
  });

  it('should include valid locations and exclude invalid ones precisely', () => {
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
        location: '',
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Item 3',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(3),
        location: '   ',
      }),
      createMockInventoryItem({
        id: createItemId('4'),
        name: 'Item 4',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(4),
        location: 'Garage',
      }),
    ];

    const { result } = renderHook(() => useLocationSuggestions(items));
    expect(result.current).toEqual(['Garage']);
    expect(result.current).toHaveLength(1);
  });
});
