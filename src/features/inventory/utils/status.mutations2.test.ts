/**
 * Additional mutation-killing tests for inventory/status.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import { calculateTotalMissingQuantity } from './status';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { createMockInventoryItem } from '@/shared/utils/test/factories';

const baseItem = createMockInventoryItem({
  id: createItemId('mut-status-1'),
  name: 'Mutation Test Item',
  itemType: createProductTemplateId('mut-item'),
  categoryId: createCategoryId('tools-supplies'),
  quantity: createQuantity(5),
  unit: 'pieces',
  neverExpires: true,
  expirationDate: undefined,
});

// ============================================================================
// L248: LogicalOperator - item.itemType !== 'custom' || otherItem.itemType !== 'custom'
// Mutant: && → || (would allow custom items to match)
// ============================================================================
describe('L248: custom item type matching in calculateTotalMissingQuantity', () => {
  it('custom items do NOT aggregate quantities across matching custom items', () => {
    const customItem = createMockInventoryItem({
      ...baseItem,
      id: createItemId('custom-1'),
      itemType: createProductTemplateId('custom'),
      quantity: createQuantity(2),
      neverExpires: true,
      expirationDate: undefined,
    });

    const customItem2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('custom-2'),
      itemType: createProductTemplateId('custom'),
      quantity: createQuantity(3),
      neverExpires: true,
      expirationDate: undefined,
    });

    // Custom items should NOT match each other
    // With || mutant: 'custom' !== 'custom' = false, but with ||, one false || other conditions...
    // The original requires BOTH items to be non-custom AND have same type
    const result = calculateTotalMissingQuantity(
      customItem,
      [customItem, customItem2],
      10,
    );

    // Custom items don't match -> falls back to calculateMissingQuantity
    // Individual: qty=2, rec=10, no expiration -> missing = 8
    expect(result).toBe(8);
  });

  it('non-custom items with same type aggregate correctly', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('item-1'),
      itemType: createProductTemplateId('flashlight'),
      quantity: createQuantity(2),
      neverExpires: true,
      expirationDate: undefined,
    });

    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('item-2'),
      itemType: createProductTemplateId('flashlight'),
      quantity: createQuantity(3),
      neverExpires: true,
      expirationDate: undefined,
    });

    // Non-custom, same type -> should aggregate: 2+3=5, rec=10, missing=5
    const result = calculateTotalMissingQuantity(item1, [item1, item2], 10);
    expect(result).toBe(5);
  });
});

// ============================================================================
// L260: BlockStatement - recommendedQuantity <= 0 check
// Mutant: removes the block (return 0) so negative quantities flow through
// ============================================================================
describe('L260: recommendedQuantity <= 0 guard in calculateTotalMissingQuantity', () => {
  it('returns 0 when recommendedQuantity is 0', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('zero-rec'),
      itemType: createProductTemplateId('flashlight'),
      quantity: createQuantity(5),
      neverExpires: true,
      expirationDate: undefined,
    });

    const result = calculateTotalMissingQuantity(item, [item], 0);
    expect(result).toBe(0);
  });

  it('returns 0 when recommendedQuantity is negative', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('neg-rec'),
      itemType: createProductTemplateId('flashlight'),
      quantity: createQuantity(5),
      neverExpires: true,
      expirationDate: undefined,
    });

    const result = calculateTotalMissingQuantity(item, [item], -1);
    expect(result).toBe(0);
  });
});

// ============================================================================
// L292: EqualityOperator - totalActual < recommendedQuantity
// Mutant: <= (includes equality)
// ============================================================================
describe('L292: totalActual < recommendedQuantity boundary', () => {
  it('returns 0 when totalActual equals recommendedQuantity exactly', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('exact-qty'),
      itemType: createProductTemplateId('flashlight'),
      quantity: createQuantity(10),
      neverExpires: true,
      expirationDate: undefined,
    });

    // totalActual (10) === recommended (10): original returns 0 (no shortage)
    // Mutant (<=): 10 <= 10 = true -> shortage detected -> Math.max(0, 10-10) = 0
    // This is an equivalent mutant at the boundary because Math.max(0, 0) = 0
    const result = calculateTotalMissingQuantity(item, [item], 10);
    expect(result).toBe(0);
  });

  it('returns missing when totalActual is less than recommended', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('less-qty'),
      itemType: createProductTemplateId('flashlight'),
      quantity: createQuantity(3),
      neverExpires: true,
      expirationDate: undefined,
    });

    const result = calculateTotalMissingQuantity(item, [item], 10);
    expect(result).toBe(7);
  });

  it('returns 0 when totalActual exceeds recommended', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('excess-qty'),
      itemType: createProductTemplateId('flashlight'),
      quantity: createQuantity(15),
      neverExpires: true,
      expirationDate: undefined,
    });

    const result = calculateTotalMissingQuantity(item, [item], 10);
    expect(result).toBe(0);
  });
});

// ============================================================================
// L295: BlockStatement - hasShortage check block
// Mutant: removes the return 0 for no-shortage case
// ============================================================================
describe('L295: hasShortage guard block in calculateTotalMissingQuantity', () => {
  it('returns 0 when there is no shortage (kills BlockStatement={})', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('no-shortage'),
      itemType: createProductTemplateId('flashlight'),
      quantity: createQuantity(20),
      neverExpires: true,
      expirationDate: undefined,
    });

    // totalActual (20) > recommended (10): no shortage
    // If block is removed, would fall through to Math.max(0, 10-20) = 0 (same result)
    // This is likely an equivalent mutant. But let's verify anyway.
    const result = calculateTotalMissingQuantity(item, [item], 10);
    expect(result).toBe(0);
    expect(typeof result).toBe('number');
  });
});
