/**
 * Mutation-killing tests for status.ts
 *
 * These tests target specific surviving mutants identified by Stryker mutation testing.
 * Each test is designed to fail if the corresponding mutation is applied.
 */
import { describe, it, expect } from 'vitest';
import {
  getItemStatus,
  getDaysUntilExpiration,
  isItemExpired,
  calculateMissingQuantity,
  calculateTotalMissingQuantity,
} from './status';
import {
  createDateOnly,
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { toLocalDateString } from '@/shared/utils/test/date-helpers';

// Helper to create a date N days from now
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toLocalDateString(d);
}

const baseItem = createMockInventoryItem({
  id: createItemId('mut-1'),
  name: 'Mutation Test Item',
  itemType: createProductTemplateId('mut-item'),
  categoryId: createCategoryId('tools-supplies'),
  quantity: createQuantity(5),
  unit: 'pieces',
  neverExpires: true,
  expirationDate: undefined,
});

describe('Mutation killing: parseDateOnly month + 1 (L29 ArithmeticOperator)', () => {
  // If month - 1 is mutated to month + 1 (or month - 0, etc.), the parsed date
  // will be wrong and getDaysUntilExpiration will return incorrect values.
  // We verify by checking a known date produces the exact expected result.
  it('parses month correctly - January date returns expected days', () => {
    // Use a date far in the future with a specific month to detect off-by-one
    const today = new Date();
    const todayStr = toLocalDateString(today);
    // getDaysUntilExpiration for today should be exactly 0
    const days = getDaysUntilExpiration(createDateOnly(todayStr), false);
    expect(days).toBe(0);
  });

  it('parses month correctly - specific known date gives correct days', () => {
    // 10 days from now should give exactly 10
    const date = daysFromNow(10);
    const days = getDaysUntilExpiration(createDateOnly(date), false);
    expect(days).toBe(10);
  });

  it('parses month correctly - negative days for past date', () => {
    const date = daysFromNow(-3);
    const days = getDaysUntilExpiration(createDateOnly(date), false);
    expect(days).toBe(-3);
  });
});

describe('Mutation killing: getItemStatus expiration condition (L79)', () => {
  // L79: `!neverExpires && expirationDate`
  // Mutant: ConditionalExpression -> true (always enter expiration branch)
  // Mutant: LogicalOperator -> `!neverExpires || expirationDate`

  it('neverExpires=true WITH expirationDate should ignore expiration (return ok, not critical)', () => {
    // If mutated to `true`, it would always check expiration -> critical
    // If mutated to `||`, !true || pastDate = false || true = true -> would check expiration
    const pastDate = createDateOnly(daysFromNow(-5));
    const status = getItemStatus(10, 10, pastDate, true);
    expect(status).toBe('ok');
  });

  it('neverExpires=false WITHOUT expirationDate should skip expiration check', () => {
    // If mutated to `true`, it would try to check expiration even without a date
    // With no date, getDaysUntilExpiration returns undefined, so no crash but behavior differs
    const status = getItemStatus(10, 10, undefined, false);
    expect(status).toBe('ok');
  });

  it('neverExpires=true WITHOUT expirationDate should not enter expiration branch', () => {
    // Both conditions false -> should skip. If `||`, !true || undefined = false || false = false (same)
    // But if `true`, always enters -> getDaysUntilExpiration(undefined, true) = undefined -> ok
    const status = getItemStatus(0, 10, undefined, true);
    // Without expiration, quantity 0 -> critical
    expect(status).toBe('critical');
  });

  it('neverExpires=false WITH expirationDate enters expiration branch', () => {
    const pastDate = createDateOnly(daysFromNow(-1));
    expect(getItemStatus(10, 10, pastDate, false)).toBe('critical');
  });
});

describe('Mutation killing: calculateMissingQuantity conditions (L202, L204, L208)', () => {
  // L202: `item.quantity < recommendedQuantity`
  // EqualityOperator mutant: `item.quantity <= recommendedQuantity`
  // When quantity === recommended, original returns false (no shortage), mutant returns true
  // NOTE: L202 EqualityOperator (< to <=) is an equivalent mutant for calculateMissingQuantity.
  // At boundary (qty === rec), Math.max(0, rec - qty) = 0 regardless of hasShortage value.
  it('L202: quantity exactly equal to recommended -> no shortage', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(10),
      neverExpires: true,
      expirationDate: undefined,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });

  // L204: `hasShortage && !expired && !isExpiringSoon && !item.markedAsEnough && recommendedQuantity > 0`
  // ConditionalExpression mutant: true (always treat as quantity issue)
  // LogicalOperator mutant: `hasShortage || !expired` (changing first && to ||)
  it('L204: has shortage AND expired -> return 0 (kills ConditionalExpression=true)', () => {
    // hasShortage=true (qty < rec), expired=true
    // Original: true && !true(expired) = false -> isQuantityIssue=false -> return 0
    // Mutant (true): isQuantityIssue=true -> return Math.max(0, 10-3) = 7
    const expiredDate = createDateOnly(daysFromNow(-5));
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(3), // Less than recommended (10)
      expirationDate: expiredDate,
      neverExpires: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });

  it('L204: has shortage AND is expired -> return 0 (expiration takes precedence)', () => {
    // hasShortage=true, expired=true
    // Original: true && !true = true && false = false -> 0
    // Mutant (||): true || !true = true || false = true -> continues checking -> may return non-zero
    const expiredDate = createDateOnly(daysFromNow(-5));
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(1),
      expirationDate: expiredDate,
      neverExpires: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });

  it('L204: has shortage, NOT expired, NOT expiring soon -> returns missing quantity', () => {
    // hasShortage=true, expired=false, isExpiringSoon=false, markedAsEnough=false, rec>0
    // All conditions met -> isQuantityIssue=true -> return missing
    const farFuture = createDateOnly(daysFromNow(60));
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(3),
      expirationDate: farFuture,
      neverExpires: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(7);
  });

  it('L204: has shortage, not expired, but expiring soon -> return 0', () => {
    // hasShortage=true, expired=false, isExpiringSoon=true
    // Original: true && true && !true = false -> 0
    // Mutant (|| for first &&): true || true = true, then && !true = false -> 0 (same)
    // But ConditionalExpression -> true would return non-zero
    const soonDate = createDateOnly(daysFromNow(15));
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(1),
      expirationDate: soonDate,
      neverExpires: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });

  // NOTE: L204 LogicalOperator (|| mutant) is equivalent for the no-shortage case.
  // When hasShortage=false, qty >= rec, so Math.max(0, rec-qty) = 0 regardless.
  // The || mutant is killed by the hasShortage=true + expired=true test above.
  it('L204: no shortage, not expired -> return 0 (regression)', () => {
    const farFuture = createDateOnly(daysFromNow(60));
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(15),
      expirationDate: farFuture,
      neverExpires: false,
      markedAsEnough: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });

  // NOTE: L208 EqualityOperator (> to >=) is an equivalent mutant.
  // hasShortage = qty < 0 is impossible with non-negative quantities.
  it('L208: recommendedQuantity exactly 0 -> return 0 (regression)', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(0),
      neverExpires: true,
      expirationDate: undefined,
    });
    expect(calculateMissingQuantity(item, 0)).toBe(0);
  });

  // L208 alternative: If ConditionalExpression mutant on L208 makes it `true`
  // Then recommendedQuantity > 0 always true. With rec=0 and hasShortage somehow...
  // Actually the ConditionalExpression mutant makes the WHOLE condition on L203-208 true.
  // That means isQuantityIssue is always true. Then return Math.max(0, rec - qty).
  // With rec=0 and qty=5: Math.max(0, 0-5) = 0. Same result.
  // With rec=0 and qty=0: Math.max(0, 0-0) = 0. Same result.
  // To kill: need isQuantityIssue=false but Math.max(0, rec-qty) != 0
  // That means rec > qty (so Math.max gives positive) but isQuantityIssue is false.
  // isQuantityIssue is false when: !hasShortage || expired || expiringSoon || markedAsEnough || rec<=0
  // Case: markedAsEnough=true, qty=1, rec=10 -> isQuantityIssue=false, but Math.max(0,10-1)=9
  // Mutant (true) -> return 9 instead of 0!
  it('L204/L208 ConditionalExpression=true: markedAsEnough should return 0', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(1),
      neverExpires: true,
      expirationDate: undefined,
      markedAsEnough: true,
    });
    // Original: isQuantityIssue=false (markedAsEnough) -> return 0
    // Mutant (true): isQuantityIssue=true -> return Math.max(0, 10-1) = 9
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });
});

describe('Mutation killing: calculateTotalMissingQuantity item type checks (L248-249)', () => {
  // L248: `item.itemType !== 'custom' && otherItem.itemType !== 'custom' && item.itemType === otherItem.itemType`
  // StringLiteral mutants: '' instead of 'custom' on L248 and L249
  // LogicalOperator mutant: `||` instead of `&&` between the two custom checks
  // ConditionalExpression mutant: true (always match)

  it('L248 StringLiteral: non-custom items should match by itemType', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('st-1'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(2),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('st-2'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(3),
    });
    // Total: 5, recommended: 10, missing: 5
    expect(calculateTotalMissingQuantity(item1, [item1, item2], 10)).toBe(5);
  });

  it('L248: custom item should NOT match other custom items', () => {
    const customItem1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('c-1'),
      itemType: createProductTemplateId('custom'),
      quantity: createQuantity(1),
    });
    const customItem2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('c-2'),
      itemType: createProductTemplateId('custom'),
      quantity: createQuantity(2),
    });
    // If mutated to '' instead of 'custom': 'custom' !== '' is true, so items WOULD match
    // Original: 'custom' !== 'custom' is false -> no match -> fallback to individual
    // Individual: calculateMissingQuantity(customItem1, 10) = 10 - 1 = 9
    // Mutant ('' on L248): 'custom' !== '' = true, passes first check,
    //   then 'custom' !== 'custom' = false (L249 not mutated) OR
    //   if L249 also mutated to '', both pass, itemType match -> total = 3, missing = 7
    expect(
      calculateTotalMissingQuantity(
        customItem1,
        [customItem1, customItem2],
        10,
      ),
    ).toBe(9);
  });

  it('L248: first item custom, second non-custom -> no match', () => {
    const customItem = createMockInventoryItem({
      ...baseItem,
      id: createItemId('cn-1'),
      itemType: createProductTemplateId('custom'),
      quantity: createQuantity(1),
    });
    const normalItem = createMockInventoryItem({
      ...baseItem,
      id: createItemId('cn-2'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(5),
    });
    // custom item shouldn't match normal item -> fallback
    // If || mutant: item.itemType !== 'custom' || otherItem.itemType !== 'custom'
    // For customItem checking against normalItem: 'custom' !== 'custom' = false || 'water' !== 'custom' = true -> true
    // Then item.itemType === otherItem.itemType: 'custom' === 'water' = false -> no match still
    // For customItem checking against itself: false || false = false -> no match
    // So || mutant might not matter here for custom items since itemType equality still fails
    expect(
      calculateTotalMissingQuantity(customItem, [customItem, normalItem], 10),
    ).toBe(9);
  });

  it('L248 LogicalOperator (||): non-custom items of different types should NOT match', () => {
    // If mutated to ||: item.itemType !== 'custom' || otherItem.itemType !== 'custom'
    // For two non-custom items of different types: true || true = true (same as &&: true && true = true)
    // But then item.itemType === otherItem.itemType still fails. So || doesn't change behavior for non-custom.
    // The || matters when one is custom: false || true = true (with ||) vs false && true = false (with &&)
    // So: item is custom, otherItem is non-custom, same "itemType" value... impossible since custom !== water
    // Actually the || mutant matters differently. Let me think...
    // With &&: BOTH must be non-custom. With ||: at least one must be non-custom.
    // If item='custom', other='custom': && gives false&&false=false, || gives false||false=false. Same.
    // If item='custom', other='water': && gives false&&true=false, || gives false||true=true. DIFFERENT!
    //   But then itemType match 'custom'==='water' is false so no match anyway.
    // If item='water', other='custom': && gives true&&false=false, || gives true||false=true. DIFFERENT!
    //   But then itemType match 'water'==='custom' is false.
    // The || mutant can only matter if a custom and non-custom item somehow have the same itemType,
    // which is impossible. So this mutant may be equivalent. Let's just ensure the basic case works.
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('lo-1'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(2),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('lo-2'),
      itemType: createProductTemplateId('food'),
      quantity: createQuantity(3),
    });
    // water and food don't match -> item1 only matches itself
    // item1: total=2, rec=10, missing=8
    expect(calculateTotalMissingQuantity(item1, [item1, item2], 10)).toBe(8);
  });
});

describe('Mutation killing: calculateTotalMissingQuantity recommendedQuantity <= 0 (L260)', () => {
  // L260: `if (recommendedQuantity <= 0) { return 0; }`
  // NOTE: Both EqualityOperator (<= to <) and BlockStatement mutants are equivalent here.
  // When rec <= 0, downstream logic also yields 0 (totalActual < rec is always false).
  // These tests serve as regression checks to document the expected behavior.

  it('L260: recommendedQuantity exactly 0 should return 0', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('rq-1'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(0),
    });
    expect(calculateTotalMissingQuantity(item, [item], 0)).toBe(0);
  });

  it('L260: recommendedQuantity negative should return 0', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('rq-2'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(5),
    });
    expect(calculateTotalMissingQuantity(item, [item], -1)).toBe(0);
  });
});

describe('Mutation killing: expiring soon boundary (L281)', () => {
  // L281: `daysUntil !== undefined && daysUntil <= EXPIRING_SOON_DAYS_THRESHOLD`
  // EqualityOperator mutant: `daysUntil < EXPIRING_SOON_DAYS_THRESHOLD` (30)
  // At exactly 30 days: original <= returns true (expiring soon), mutant < returns false

  it('L281: item expiring in exactly 30 days should be treated as expiring soon', () => {
    const in30Days = createDateOnly(daysFromNow(30));
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('exp-1'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(1),
      expirationDate: in30Days,
      neverExpires: false,
    });
    // hasExpirationIssue should be true (30 <= 30 is true)
    // If mutated to <: 30 < 30 = false -> hasExpirationIssue = false
    // Then hasShortage = 1 < 10 = true -> return 10 - 1 = 9
    // Original: hasExpirationIssue = true -> return 0
    expect(calculateTotalMissingQuantity(item1, [item1], 10)).toBe(0);
  });

  it('L281: item expiring in 31 days should NOT be expiring soon', () => {
    const in31Days = createDateOnly(daysFromNow(31));
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('exp-2'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(1),
      expirationDate: in31Days,
      neverExpires: false,
    });
    // 31 <= 30 = false, 31 < 30 = false -> both give false -> no expiration issue
    // hasShortage = 1 < 10 = true -> return 9
    expect(calculateTotalMissingQuantity(item1, [item1], 10)).toBe(9);
  });

  it('L281: item expiring in 29 days is expiring soon', () => {
    const in29Days = createDateOnly(daysFromNow(29));
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('exp-3'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(1),
      expirationDate: in29Days,
      neverExpires: false,
    });
    // 29 <= 30 = true, 29 < 30 = true -> both true -> return 0
    expect(calculateTotalMissingQuantity(item1, [item1], 10)).toBe(0);
  });
});

describe('Mutation killing: totalActual < recommendedQuantity (L292)', () => {
  // L292: `const hasShortage = totalActual < recommendedQuantity`
  // EqualityOperator mutant: `totalActual <= recommendedQuantity`
  // At exact boundary (total === recommended): original < gives false, mutant <= gives true

  // NOTE: L292 EqualityOperator (< to <=) is an equivalent mutant at boundary.
  // When total === rec, Math.max(0, rec - total) = 0 regardless.
  it('L292: total exactly equals recommended -> no shortage', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('ts-1'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(6),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('ts-2'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(4),
    });
    expect(calculateTotalMissingQuantity(item1, [item1, item2], 10)).toBe(0);
  });

  it('L292: total one less than recommended -> has shortage', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('ts-3'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(5),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('ts-4'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(4),
    });
    // Total = 9, rec = 10 -> missing = 1
    expect(calculateTotalMissingQuantity(item1, [item1, item2], 10)).toBe(1);
  });
});

describe('Mutation killing: BlockStatement L295 (!hasShortage return 0)', () => {
  // NOTE: L295 BlockStatement mutant is equivalent. When !hasShortage, total >= rec,
  // so Math.max(0, rec - total) = 0 regardless of whether the early return executes.
  it('no shortage returns 0 (total exceeds recommended)', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('bs-1'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(15),
    });
    expect(calculateTotalMissingQuantity(item, [item], 10)).toBe(0);
  });
});

describe('Mutation killing: getItemStatus neverExpires with expirationDate edge cases', () => {
  // Additional tests to ensure neverExpires flag is properly respected

  it('neverExpires=true with future expiration date returns ok (not warning)', () => {
    const futureDate = createDateOnly(daysFromNow(10));
    // If L79 condition mutated to true, this would return warning
    expect(getItemStatus(10, 10, futureDate, true)).toBe('ok');
  });

  it('neverExpires=false with no date and zero quantity returns critical (from quantity check)', () => {
    // Ensures the code path after skipping expiration check still works
    expect(getItemStatus(0, 10, undefined, false)).toBe('critical');
  });

  it('neverExpires=undefined (falsy) with past date returns critical', () => {
    const pastDate = createDateOnly(daysFromNow(-1));
    expect(getItemStatus(10, 10, pastDate)).toBe('critical');
  });

  it('neverExpires=undefined (falsy) without date returns ok for sufficient quantity', () => {
    expect(getItemStatus(10, 10)).toBe('ok');
  });
});

describe('Mutation killing: isItemExpired edge cases for L42/L60 conditions', () => {
  // These parallel the getItemStatus expiration conditions

  it('neverExpires=true with past date returns false', () => {
    const pastDate = createDateOnly(daysFromNow(-10));
    expect(isItemExpired(pastDate, true)).toBe(false);
  });

  it('neverExpires=false with no date returns false', () => {
    expect(isItemExpired(undefined, false)).toBe(false);
  });

  it('neverExpires=true with no date returns false', () => {
    expect(isItemExpired(undefined, true)).toBe(false);
  });
});

describe('Mutation killing: calculateMissingQuantity hasShortage && !expired combinations', () => {
  // Testing all 4 combinations of hasShortage and expired for L204

  it('hasShortage=true, expired=false -> returns missing quantity', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(3),
      neverExpires: true,
      expirationDate: undefined,
      markedAsEnough: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(7);
  });

  it('hasShortage=true, expired=true -> returns 0', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(3),
      expirationDate: createDateOnly(daysFromNow(-5)),
      neverExpires: false,
      markedAsEnough: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });

  it('hasShortage=false, expired=false -> returns 0', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(10),
      neverExpires: true,
      expirationDate: undefined,
      markedAsEnough: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });

  it('hasShortage=false, expired=true -> returns 0', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      quantity: createQuantity(15),
      expirationDate: createDateOnly(daysFromNow(-5)),
      neverExpires: false,
      markedAsEnough: false,
    });
    expect(calculateMissingQuantity(item, 10)).toBe(0);
  });
});

describe('Mutation killing: calculateTotalMissingQuantity ConditionalExpression=true (L248)', () => {
  // If the filter condition is always true, ALL items match regardless of type
  // This means different itemTypes would be summed together

  it('different itemTypes should NOT be summed together', () => {
    const waterItem = createMockInventoryItem({
      ...baseItem,
      id: createItemId('ce-1'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(2),
    });
    const foodItem = createMockInventoryItem({
      ...baseItem,
      id: createItemId('ce-2'),
      itemType: createProductTemplateId('food'),
      quantity: createQuantity(8),
    });
    // For waterItem: only matches itself -> total=2, rec=10, missing=8
    // If mutated to true: matches both -> total=10, rec=10, missing=0
    expect(
      calculateTotalMissingQuantity(waterItem, [waterItem, foodItem], 10),
    ).toBe(8);
  });

  it('custom items mixed with non-custom should not cross-match', () => {
    const normalItem = createMockInventoryItem({
      ...baseItem,
      id: createItemId('ce-3'),
      itemType: createProductTemplateId('water'),
      quantity: createQuantity(2),
    });
    const customItem = createMockInventoryItem({
      ...baseItem,
      id: createItemId('ce-4'),
      itemType: createProductTemplateId('custom'),
      quantity: createQuantity(8),
    });
    // normalItem should only match itself -> total=2, missing=8
    // If filter always true: total=10, missing=0
    expect(
      calculateTotalMissingQuantity(normalItem, [normalItem, customItem], 10),
    ).toBe(8);
  });
});
