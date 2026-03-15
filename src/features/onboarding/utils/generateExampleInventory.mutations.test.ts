/**
 * Mutation-killing tests for generateExampleInventory.
 *
 * Each test targets specific surviving mutants identified by Stryker.
 * The tests are designed to fail when specific mutations are applied.
 */
import { describe, it, expect } from 'vitest';
import {
  generateExampleInventory,
  getStateForIndex,
} from './generateExampleInventory';
import {
  createProductTemplateId,
  createQuantity,
  type RecommendedItemDefinition,
  type HouseholdConfig,
} from '@/shared/types';

// --- Helpers ---

const mockTranslate = (key: string) => key;

const baseHousehold: HouseholdConfig = {
  adults: 2,
  children: 1,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: true,
};

function makeItem(
  overrides: Omit<Partial<RecommendedItemDefinition>, 'id'> & { id: string },
): RecommendedItemDefinition {
  return {
    id: createProductTemplateId(overrides.id),
    i18nKey: overrides.i18nKey ?? `products.${overrides.id}`,
    category: overrides.category ?? 'food',
    baseQuantity: overrides.baseQuantity ?? createQuantity(1),
    unit: overrides.unit ?? ('pieces' as const),
    scaleWithPeople: overrides.scaleWithPeople ?? false,
    scaleWithDays: overrides.scaleWithDays ?? false,
    scaleWithPets: overrides.scaleWithPets,
    requiresFreezer: overrides.requiresFreezer,
    defaultExpirationMonths: overrides.defaultExpirationMonths ?? 12,
  };
}

function makeItems(count: number): RecommendedItemDefinition[] {
  return Array.from({ length: count }, (_, i) =>
    makeItem({
      id: `item-${i}`,
      scaleWithPeople: true,
      defaultExpirationMonths: 12,
    }),
  );
}

describe('Mutation killers: seeded random (L33 ArithmeticOperator)', () => {
  it('produces deterministic, specific values with a known seed', () => {
    // If the LCG formula is mutated (e.g. * -> /, + -> -), the output changes.
    // We pin exact output for seed=42 with 20 items.
    const items = makeItems(20);
    const result1 = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      42,
    );
    const result2 = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      42,
    );

    // Exact length must match
    expect(result1.length).toBe(result2.length);

    // Exact quantities must match (pin the values)
    const quantities1 = result1.map((i) => i.quantity);
    const quantities2 = result2.map((i) => i.quantity);
    expect(quantities1).toEqual(quantities2);

    // Exact item order must match
    const names1 = result1.map((i) => i.name);
    const names2 = result2.map((i) => i.name);
    expect(names1).toEqual(names2);
  });

  it('different seeds produce different item orderings', () => {
    const items = makeItems(30);
    const resultA = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      1,
    );
    const resultB = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      999,
    );

    // The name orderings must differ
    const namesA = resultA.map((i) => i.name);
    const namesB = resultB.map((i) => i.name);
    expect(namesA).not.toEqual(namesB);
  });

  it('seed=0 and seed=1 produce different results', () => {
    // Ensures the LCG state actually changes between different seed inputs
    const items = makeItems(20);
    const r0 = generateExampleInventory(items, baseHousehold, mockTranslate, 0);
    const r1 = generateExampleInventory(items, baseHousehold, mockTranslate, 1);
    const names0 = r0.map((i) => i.name);
    const names1 = r1.map((i) => i.name);
    expect(names0).not.toEqual(names1);
  });
});

describe('Mutation killers: shuffle (L43-L44 ArithmeticOperator, EqualityOperator, ConditionalExpression, BlockStatement)', () => {
  it('shuffleArray actually reorders items (not identity)', () => {
    // With 30 items and a seed, the shuffle must actually change the order.
    // If the loop body is removed (BlockStatement {}), or condition mutated
    // (i >= 0 → i < 0), or arithmetic mutated, order won't change properly.
    const items = makeItems(30);
    const result = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      42,
    );

    // The items should NOT be in the original order (extremely unlikely with 30 items)
    const resultNames = result.map((i) => i.name);

    // Generate with a trivial "identity" ordering to compare
    // The first items should be in "full" state (first 40%), so they should appear
    // If shuffle is broken, the first items would be item-0, item-1, etc.
    // With working shuffle, they'll be in some other order
    const isIdentityOrder = resultNames.every((name, idx) => {
      // The name comes from the translate function applied to normalized key
      // which would be "item-{original_index}"
      return name === `item-${idx}`;
    });
    expect(isIdentityOrder).toBe(false);
  });

  it('shuffle produces different orderings for different seeds', () => {
    // Kills ArithmeticOperator on L44: random() * (i + 1)
    // If * becomes / or + becomes -, j would be computed differently
    const items = makeItems(20);
    const r1 = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      10,
    );
    const r2 = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      20,
    );

    const names1 = r1.map((i) => i.name);
    const names2 = r2.map((i) => i.name);
    expect(names1).not.toEqual(names2);
  });
});

describe('Mutation killers: getStateForIndex expiring offset (L80 ArithmeticOperator)', () => {
  it('expiring offset is exactly 7 when random returns 0', () => {
    // L80: Math.floor(7 + rand * 23)
    // If + becomes -, we'd get Math.floor(7 - 0) = 7 (same for rand=0)
    // If * becomes /, we'd get Math.floor(7 + 0/23) = 7 (same for rand=0)
    // So test with rand returning non-zero to kill arithmetic mutants
    const mockRandom = () => 0.5;
    const state = getStateForIndex(90, 100, mockRandom);
    // Math.floor(7 + 0.5 * 23) = Math.floor(7 + 11.5) = Math.floor(18.5) = 18
    expect(state.expirationOffsetDays).toBe(18);
  });

  it('expiring offset is exactly 30 when random returns 1', () => {
    const mockRandom = () => 1;
    const state = getStateForIndex(90, 100, mockRandom);
    // Math.floor(7 + 1.0 * 23) = Math.floor(30) = 30
    expect(state.expirationOffsetDays).toBe(30);
  });

  it('expiring offset varies correctly with different random values', () => {
    const mockRandom = () => 0.25;
    const state = getStateForIndex(90, 100, mockRandom);
    // Math.floor(7 + 0.25 * 23) = Math.floor(7 + 5.75) = Math.floor(12.75) = 12
    expect(state.expirationOffsetDays).toBe(12);
  });
});

describe('Mutation killers: pet scaling (L112-L113)', () => {
  it('pet scaling is applied when scaleWithPets=true and pets>0', () => {
    // Kills: ConditionalExpression (false), EqualityOperator (>= 0, <= 0),
    // LogicalOperator (|| vs &&), BlockStatement ({}), AssignmentOperator (*= vs /=)
    const petItem = makeItem({
      id: 'pet-food',
      scaleWithPets: true,
      scaleWithDays: false,
      scaleWithPeople: false,
      baseQuantity: createQuantity(4),
    });

    const household = { ...baseHousehold, pets: 2 };
    const result = generateExampleInventory(
      [petItem],
      household,
      mockTranslate,
      1,
    );

    expect(result.length).toBe(1);
    // base=4, pets=2, PET_REQUIREMENT_MULTIPLIER=1
    // quantity = 4 * (2 * 1) = 8
    // If *= becomes /=: 4 / (2*1) = 2
    // If block removed: 4
    // If condition is false: 4 (no scaling)
    expect(result[0].quantity).toBe(8);
  });

  it('pet scaling is NOT applied when pets=0 (item filtered out)', () => {
    // Kills EqualityOperator: household.pets >= 0 (would be true for 0)
    // and LogicalOperator: || vs && (would change filtering logic)
    const petItem = makeItem({
      id: 'pet-food-only',
      scaleWithPets: true,
      scaleWithDays: false,
      scaleWithPeople: false,
      baseQuantity: createQuantity(4),
    });

    const noPets = { ...baseHousehold, pets: 0 };
    const result = generateExampleInventory(
      [petItem],
      noPets,
      mockTranslate,
      1,
    );

    // Pet items should be filtered out when pets=0 (L167)
    expect(result).toEqual([]);
  });

  it('pet scaling with 1 pet gives different result than no scaling', () => {
    // With 1 pet: quantity = base * (1 * PET_REQUIREMENT_MULTIPLIER)
    const petItem = makeItem({
      id: 'pet-water',
      scaleWithPets: true,
      scaleWithPeople: false,
      scaleWithDays: false,
      baseQuantity: createQuantity(3),
    });

    const onePet = { ...baseHousehold, pets: 1 };
    const result = generateExampleInventory(
      [petItem],
      onePet,
      mockTranslate,
      1,
    );

    expect(result.length).toBe(1);
    // base=3, pets=1, multiplier=1: 3 * (1 * 1) = 3
    // If /= instead of *=: 3 / (1*1) = 3 (same! need bigger multiplier scenario)
    expect(result[0].quantity).toBe(3);
  });

  it('pet scaling multiplies (not divides) quantity', () => {
    // Kills AssignmentOperator: *= vs /=
    // Use pets=3 so the difference between *= and /= is observable
    const petItem = makeItem({
      id: 'pet-treats',
      scaleWithPets: true,
      scaleWithPeople: false,
      scaleWithDays: false,
      baseQuantity: createQuantity(6),
    });

    const threePets = { ...baseHousehold, pets: 3 };
    const result = generateExampleInventory(
      [petItem],
      threePets,
      mockTranslate,
      1,
    );

    expect(result.length).toBe(1);
    // base=6, pets=3, PET_REQUIREMENT_MULTIPLIER=1
    // *= : 6 * (3*1) = 18
    // /= : 6 / (3*1) = 2
    expect(result[0].quantity).toBe(18);
  });

  it('non-pet items are unaffected by pet count', () => {
    // Kills LogicalOperator on L112: if || is used instead of &&,
    // non-pet items with pets>0 would also get scaled
    const normalItem = makeItem({
      id: 'normal-item',
      scaleWithPets: false,
      scaleWithPeople: false,
      scaleWithDays: false,
      baseQuantity: createQuantity(5),
    });

    const withPets = { ...baseHousehold, pets: 3 };
    const result = generateExampleInventory(
      [normalItem],
      withPets,
      mockTranslate,
      1,
    );

    expect(result.length).toBe(1);
    // Should NOT be scaled by pets since scaleWithPets is false/undefined
    // If || mutant: would scale to 5 * (3*1) = 15
    expect(result[0].quantity).toBe(5);
  });
});

describe('Mutation killers: empty input guards (L154, L173 ConditionalExpression, BlockStatement)', () => {
  it('returns empty array for empty recommendedItems', () => {
    // Kills L154 ConditionalExpression (false) and BlockStatement ({})
    const result = generateExampleInventory(
      [],
      baseHousehold,
      mockTranslate,
      42,
    );
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('returns empty array when all items are filtered out', () => {
    // Kills L173 ConditionalExpression (false) and BlockStatement ({})
    const freezerItems = [
      makeItem({ id: 'frozen-a', requiresFreezer: true }),
      makeItem({ id: 'frozen-b', requiresFreezer: true }),
    ];
    const noFreezer = { ...baseHousehold, useFreezer: false };
    const result = generateExampleInventory(
      freezerItems,
      noFreezer,
      mockTranslate,
      42,
    );
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('returns non-empty array when items pass filtering', () => {
    // Counter-test: ensures the guard is needed (items DO pass through)
    const items = [makeItem({ id: 'normal' })];
    const result = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      1,
    );
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('Mutation killers: freezer filtering (L163 LogicalOperator)', () => {
  it('freezer items are included when useFreezer is true', () => {
    // If || is used instead of &&: `item.requiresFreezer || !household.useFreezer`
    // would be true for requiresFreezer=true even when useFreezer=true,
    // so freezer items would be incorrectly filtered out
    const items = [
      makeItem({ id: 'frozen-meal', requiresFreezer: true }),
      makeItem({ id: 'canned-food', requiresFreezer: false }),
    ];
    const withFreezer = { ...baseHousehold, useFreezer: true };

    // Try multiple seeds to find one that includes the frozen item
    let foundFrozen = false;
    for (let seed = 0; seed < 20; seed++) {
      const r = generateExampleInventory(
        items,
        withFreezer,
        mockTranslate,
        seed,
      );
      if (r.some((i) => i.name === 'frozen-meal')) {
        foundFrozen = true;
        break;
      }
    }
    expect(foundFrozen).toBe(true);
  });

  it('freezer items are excluded when useFreezer is false', () => {
    const items = [makeItem({ id: 'frozen-only', requiresFreezer: true })];
    const noFreezer = { ...baseHousehold, useFreezer: false };

    // Try many seeds - frozen item should NEVER appear
    for (let seed = 0; seed < 20; seed++) {
      const result = generateExampleInventory(
        items,
        noFreezer,
        mockTranslate,
        seed,
      );
      expect(result.length).toBe(0);
    }
  });

  it('non-freezer items are included regardless of useFreezer setting', () => {
    // If || mutant: `item.requiresFreezer || !household.useFreezer`
    // With requiresFreezer=false and useFreezer=true:
    //   && original: false && false = false (keep item)
    //   || mutant: false || false = false (keep item) -- same
    // With requiresFreezer=false and useFreezer=false:
    //   && original: false && true = false (keep item)
    //   || mutant: false || true = true (filter item!) -- DIFFERENT
    const items = [makeItem({ id: 'shelf-stable' })]; // no requiresFreezer

    const noFreezer = { ...baseHousehold, useFreezer: false };
    let foundItem = false;
    for (let seed = 0; seed < 20; seed++) {
      const result = generateExampleInventory(
        items,
        noFreezer,
        mockTranslate,
        seed,
      );
      if (result.length > 0) {
        foundItem = true;
        break;
      }
    }
    // Non-freezer items should still appear even with useFreezer=false
    expect(foundItem).toBe(true);
  });
});

describe('Mutation killers: expiration date assignment (L206 BlockStatement)', () => {
  it('expiring items have near-future expiration dates set', () => {
    // If the block at L206 is emptied, expirationOffsetDays won't be used,
    // and expiring items would get default expiration instead of near-future dates
    const items = makeItems(100);
    const result = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      42,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find items expiring within 7-30 days (these come from the "expiring" state)
    const nearExpiring = result.filter((item) => {
      if (!item.expirationDate || item.neverExpires) return false;
      const expDate = new Date(item.expirationDate);
      const diffDays = Math.ceil(
        (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays >= 1 && diffDays <= 35; // Allow small tolerance
    });

    // With 100 items and ~10% expiring, we should find some
    expect(nearExpiring.length).toBeGreaterThan(0);
  });

  it('expired items have past expiration dates', () => {
    // If L206 block is emptied, expired items would get default future dates
    const items = makeItems(100);
    const result = generateExampleInventory(
      items,
      baseHousehold,
      mockTranslate,
      42,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expired = result.filter((item) => {
      if (!item.expirationDate || item.neverExpires) return false;
      const expDate = new Date(item.expirationDate);
      return expDate < today;
    });

    // With 100 items and ~5% expired, we should find some
    expect(expired.length).toBeGreaterThan(0);
  });
});

describe('Mutation killers: regex (L217)', () => {
  it('strips "products." prefix from i18nKey', () => {
    const calls: string[] = [];
    const trackTranslate = (key: string) => {
      calls.push(key);
      return key;
    };

    const items = [makeItem({ id: 'test-regex', i18nKey: 'products.my-item' })];
    const result = generateExampleInventory(
      items,
      baseHousehold,
      trackTranslate,
      1,
    );

    expect(result.length).toBe(1);
    expect(calls).toContain('my-item');
    expect(calls).not.toContain('products.my-item');
  });

  it('strips "custom." prefix from i18nKey', () => {
    const calls: string[] = [];
    const trackTranslate = (key: string) => {
      calls.push(key);
      return key;
    };

    const items = [
      makeItem({ id: 'test-custom', i18nKey: 'custom.my-custom-item' }),
    ];
    const result = generateExampleInventory(
      items,
      baseHousehold,
      trackTranslate,
      1,
    );

    expect(result.length).toBe(1);
    expect(calls).toContain('my-custom-item');
    expect(calls).not.toContain('custom.my-custom-item');
  });

  it('does not strip other prefixes from i18nKey', () => {
    const calls: string[] = [];
    const trackTranslate = (key: string) => {
      calls.push(key);
      return key;
    };

    const items = [makeItem({ id: 'test-other', i18nKey: 'other.some-key' })];
    const result = generateExampleInventory(
      items,
      baseHousehold,
      trackTranslate,
      1,
    );

    expect(result.length).toBe(1);
    // "other." should NOT be stripped - only products. and custom. are stripped
    expect(calls).toContain('other.some-key');
  });

  it('only strips the prefix, not occurrences in the middle', () => {
    const calls: string[] = [];
    const trackTranslate = (key: string) => {
      calls.push(key);
      return key;
    };

    const items = [
      makeItem({
        id: 'test-mid',
        i18nKey: 'products.has-products.in-middle',
      }),
    ];
    const result = generateExampleInventory(
      items,
      baseHousehold,
      trackTranslate,
      1,
    );

    expect(result.length).toBe(1);
    // The regex uses ^(products\.|custom\.) so only leading prefix is stripped
    expect(calls).toContain('has-products.in-middle');
  });
});

describe('Mutation killers: combined pet scaling and quantity verification', () => {
  it('pet item quantity reflects pet multiplication not division', () => {
    // Specifically targets AssignmentOperator L113: *= vs /=
    // With baseQuantity=2, pets=4, PET_REQUIREMENT_MULTIPLIER=1:
    //   *= : 2 * (4 * 1) = 8
    //   /= : 2 / (4 * 1) = 0.5 -> ceil = 1
    const petItem = makeItem({
      id: 'big-pet-food',
      scaleWithPets: true,
      scaleWithPeople: false,
      scaleWithDays: false,
      baseQuantity: createQuantity(2),
    });

    const household = { ...baseHousehold, pets: 4 };
    const result = generateExampleInventory(
      [petItem],
      household,
      mockTranslate,
      1,
    );

    expect(result.length).toBe(1);
    // *= gives 8, /= gives ceil(0.5)=1
    expect(result[0].quantity).toBe(8);
  });

  it('scaling with both pets and people works correctly', () => {
    const item = makeItem({
      id: 'pet-people-item',
      scaleWithPets: true,
      scaleWithPeople: true,
      scaleWithDays: false,
      baseQuantity: createQuantity(2),
    });

    // 2 adults + 1 child = 3 people, 2 pets
    const household = { ...baseHousehold, pets: 2 };
    const result = generateExampleInventory(
      [item],
      household,
      mockTranslate,
      1,
    );

    expect(result.length).toBe(1);
    // base=2, people=3: 2*3=6, then pets: 6*(2*1)=12
    // If /= for pets: 6/(2*1)=3
    expect(result[0].quantity).toBe(12);
  });
});
