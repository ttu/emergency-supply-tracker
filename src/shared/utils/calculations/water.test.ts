import { describe, it, expect } from 'vitest';
import {
  validateWaterRequirement,
  getWaterRequirementPerUnit,
  calculateTotalWaterRequired,
  calculateTotalWaterAvailable,
  calculateWaterRequirements,
  calculateRecommendedWaterStorage,
  calculateTotalWaterNeeds,
} from './water';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import {
  DAILY_WATER_PER_PERSON,
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import {
  randomQuantitySmall,
  randomQuantityFloat,
} from '@/shared/utils/test/faker-helpers';
import { faker } from '@faker-js/faker';

describe('water calculations', () => {
  describe('validateWaterRequirement', () => {
    it('returns undefined for undefined value', () => {
      expect(validateWaterRequirement(undefined)).toBeUndefined();
    });

    it('returns undefined for valid positive number', () => {
      expect(validateWaterRequirement(1.5)).toBeUndefined();
      expect(validateWaterRequirement(0.1)).toBeUndefined();
      expect(validateWaterRequirement(10)).toBeUndefined();

      // Using faker to test with random valid values
      const randomValue = faker.number.float({
        min: 0.1,
        max: 100,
        fractionDigits: 2,
      });
      expect(validateWaterRequirement(randomValue)).toBeUndefined();
    });

    it('returns error for zero value', () => {
      expect(validateWaterRequirement(0)).toBe(
        'Water requirement must be greater than zero',
      );
    });

    it('returns error for negative value', () => {
      expect(validateWaterRequirement(-1)).toBe(
        'Water requirement must be greater than zero',
      );
    });

    it('returns error for non-finite values', () => {
      expect(validateWaterRequirement(Infinity)).toBe(
        'Water requirement must be a finite number',
      );
      expect(validateWaterRequirement(-Infinity)).toBe(
        'Water requirement must be greater than zero',
      );
      expect(validateWaterRequirement(Number.NaN)).toBe(
        'Water requirement must be a finite number',
      );
    });
  });

  describe('getWaterRequirementPerUnit', () => {
    it('returns 0 for items without water requirement', () => {
      const item = createMockInventoryItem({
        id: createItemId('1'),
        name: 'Crackers',
        categoryId: createCategoryId('food'),
        unit: 'packages',
      });
      expect(getWaterRequirementPerUnit(item)).toBe(0);
    });

    it('returns custom water requirement if set on item', () => {
      const waterReq = faker.number.float({
        min: 0.1,
        max: 2,
        fractionDigits: 1,
      });
      const item = createMockInventoryItem({
        id: createItemId('1'),
        name: 'Instant Noodles',
        categoryId: createCategoryId('food'),
        unit: 'packages',
        requiresWaterLiters: waterReq,
      });
      expect(getWaterRequirementPerUnit(item)).toBe(waterReq);

      // Using faker to test with random water requirement values
      const randomWaterReq = faker.number.float({
        min: 0.1,
        max: 5,
        fractionDigits: 2,
      });
      const randomItem = createMockInventoryItem({
        requiresWaterLiters: randomWaterReq,
      });
      expect(getWaterRequirementPerUnit(randomItem)).toBe(randomWaterReq);
    });

    it('returns template water requirement for items with itemType', () => {
      const item = createMockInventoryItem({
        id: createItemId('1'),
        name: 'My Pasta',
        categoryId: createCategoryId('food'),
        unit: 'kilograms',
        itemType: createProductTemplateId('pasta'),
      });
      expect(getWaterRequirementPerUnit(item)).toBe(1);
    });

    it('returns template water requirement for items with matching itemType', () => {
      const item = createMockInventoryItem({
        id: createItemId('1'),
        name: 'My Rice',
        categoryId: createCategoryId('food'),
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
      });
      expect(getWaterRequirementPerUnit(item)).toBe(1.5);
    });

    it('prefers custom water requirement over template', () => {
      const customWaterReq = faker.number.float({
        min: 1.5,
        max: 5,
        fractionDigits: 1,
      });
      const item = createMockInventoryItem({
        id: createItemId('1'),
        name: 'My Pasta',
        categoryId: createCategoryId('food'),
        unit: 'kilograms',
        itemType: createProductTemplateId('pasta'),
        requiresWaterLiters: customWaterReq, // Custom value overrides template's 1
      });
      expect(getWaterRequirementPerUnit(item)).toBe(customWaterReq);
    });
  });

  describe('calculateTotalWaterRequired', () => {
    it('returns 0 for empty items array', () => {
      expect(calculateTotalWaterRequired([])).toBe(0);
    });

    it('calculates total water required for items', () => {
      const pastaQuantity = createQuantity(randomQuantityFloat());
      const riceQuantity = createQuantity(randomQuantityFloat());
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'), // 1 L/kg
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Rice',
          categoryId: createCategoryId('food'),
          quantity: riceQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('rice'), // 1.5 L/kg
        }),
      ];
      const expected = pastaQuantity * 1 + riceQuantity * 1.5;
      // Use toBeCloseTo() to handle potential floating-point precision issues with random values
      expect(calculateTotalWaterRequired(items)).toBeCloseTo(expected, 10);
    });

    it('ignores items without water requirements', () => {
      const pastaQuantity = createQuantity(randomQuantityFloat());
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Crackers',
          categoryId: createCategoryId('food'),
          unit: 'packages',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
        }),
      ];
      // Use toBeCloseTo() to handle potential floating-point precision issues with random values
      expect(calculateTotalWaterRequired(items)).toBeCloseTo(
        pastaQuantity * 1,
        10,
      );
    });
  });

  describe('calculateTotalWaterAvailable', () => {
    it('returns 0 for empty items array', () => {
      expect(calculateTotalWaterAvailable([])).toBe(0);
    });

    it('sums water from bottled-water items in liters', () => {
      const water1 = randomQuantitySmall();
      const water2 = randomQuantitySmall();
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(water1),
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Tap Water Container',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(water2),
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(water1 + water2);
    });

    it('ignores non-water items in water-beverages category', () => {
      const waterQuantity = randomQuantitySmall();
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(waterQuantity),
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Long Life Milk',
          categoryId: createCategoryId('water-beverages'),
          unit: 'liters',
          itemType: createProductTemplateId('long-life-milk'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(waterQuantity);
    });

    it('ignores water items in wrong category', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('food'), // Wrong category
          quantity: createQuantity(10),
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(0);
    });

    it('ignores water items not in liters', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(10),
          unit: 'bottles', // Not liters
          itemType: createProductTemplateId('bottled-water'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(0);
    });
  });

  describe('calculateWaterRequirements', () => {
    it('returns correct values when no water required', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Crackers',
          categoryId: createCategoryId('food'),
          unit: 'packages',
        }),
      ];
      const result = calculateWaterRequirements(items);
      expect(result.totalWaterRequired).toBe(0);
      expect(result.hasEnoughWater).toBe(true);
      expect(result.waterShortfall).toBe(0);
      expect(result.itemsRequiringWater).toHaveLength(0);
    });

    it('returns correct values when enough water available', () => {
      const pastaQuantity = createQuantity(randomQuantityFloat());
      const waterQuantity = pastaQuantity * 1 + randomQuantitySmall(); // More than needed
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(waterQuantity),
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'), // 1 L/kg
        }),
      ];
      const result = calculateWaterRequirements(items);
      const expectedRequired = pastaQuantity * 1;
      expect(result.totalWaterRequired).toBe(expectedRequired);
      expect(result.totalWaterAvailable).toBe(waterQuantity);
      expect(result.hasEnoughWater).toBe(true);
      expect(result.waterShortfall).toBe(0);
      expect(result.itemsRequiringWater).toHaveLength(1);
    });

    it('returns correct shortfall when not enough water', () => {
      // Ensure pastaQuantity is large enough so pastaQuantity * 0.5 >= 1
      const pastaQuantity = createQuantity(
        faker.number.float({
          min: 2,
          max: 10,
          fractionDigits: 1,
        }),
      );
      const waterQuantity = faker.number.float({
        min: 0.5,
        max: pastaQuantity * 0.5,
        fractionDigits: 1,
      }); // Less than needed
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(waterQuantity),
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'), // 1 L/kg
        }),
      ];
      const result = calculateWaterRequirements(items);
      const expectedRequired = pastaQuantity * 1;
      const expectedShortfall = expectedRequired - waterQuantity;
      expect(result.totalWaterRequired).toBe(expectedRequired);
      expect(result.totalWaterAvailable).toBe(waterQuantity);
      expect(result.hasEnoughWater).toBe(false);
      expect(result.waterShortfall).toBeCloseTo(expectedShortfall, 1);
    });

    it('provides detailed items requiring water', () => {
      const pastaQuantity = createQuantity(randomQuantityFloat());
      const riceQuantity = createQuantity(randomQuantityFloat());
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'My Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'My Rice',
          categoryId: createCategoryId('food'),
          quantity: riceQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('rice'),
        }),
      ];
      const result = calculateWaterRequirements(items);
      expect(result.itemsRequiringWater).toHaveLength(2);
      expect(result.itemsRequiringWater).toContainEqual({
        itemId: '1',
        itemName: 'My Pasta',
        quantity: pastaQuantity,
        waterPerUnit: 1,
        totalWaterRequired: pastaQuantity * 1,
      });
      expect(result.itemsRequiringWater).toContainEqual({
        itemId: '2',
        itemName: 'My Rice',
        quantity: riceQuantity,
        waterPerUnit: 1.5,
        totalWaterRequired: riceQuantity * 1.5,
      });
    });
  });

  describe('calculateRecommendedWaterStorage', () => {
    it('calculates for single adult', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      });
      expect(
        calculateRecommendedWaterStorage(household, DAILY_WATER_PER_PERSON),
      ).toBe(9); // 1 * 3 * 3
    });

    it('calculates for family with children', () => {
      const household = createMockHousehold({
        adults: 2,
        children: 2,
        supplyDurationDays: 3,
        useFreezer: false,
      });
      // (2 * ADULT_REQUIREMENT_MULTIPLIER + 2 * CHILDREN_REQUIREMENT_MULTIPLIER) * 3 * 3 = 3.5 * 3 * 3 = 31.5
      expect(
        calculateRecommendedWaterStorage(household, DAILY_WATER_PER_PERSON),
      ).toBe(31.5);
    });

    it('scales with supply duration', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      });
      expect(
        calculateRecommendedWaterStorage(household, DAILY_WATER_PER_PERSON),
      ).toBe(21); // 1 * 3 * 7
    });

    it('calculates correctly with random household configurations', () => {
      const household = createMockHousehold();

      const result = calculateRecommendedWaterStorage(
        household,
        DAILY_WATER_PER_PERSON,
      );
      const expected =
        (household.adults * ADULT_REQUIREMENT_MULTIPLIER +
          household.children * CHILDREN_REQUIREMENT_MULTIPLIER) *
        DAILY_WATER_PER_PERSON *
        household.supplyDurationDays;

      expect(result).toBe(expected);
    });
  });

  describe('validateWaterRequirement - mutation killing', () => {
    it('returns error for non-number type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateWaterRequirement('not a number' as any)).toBe(
        'Water requirement must be a number',
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateWaterRequirement(true as any)).toBe(
        'Water requirement must be a number',
      );
    });
  });

  describe('getWaterRequirementPerUnit - boundary mutations', () => {
    it('returns 0 when item.requiresWaterLiters is exactly 0', () => {
      const item = createMockInventoryItem({
        id: createItemId('boundary-0'),
        name: 'Zero Water Item',
        categoryId: createCategoryId('food'),
        unit: 'packages',
        requiresWaterLiters: 0,
      });
      expect(getWaterRequirementPerUnit(item)).toBe(0);
    });

    it('returns 0 for custom itemType', () => {
      const item = createMockInventoryItem({
        id: createItemId('custom-type'),
        name: 'Custom Food',
        categoryId: createCategoryId('food'),
        unit: 'packages',
        itemType: createProductTemplateId('custom'),
      });
      expect(getWaterRequirementPerUnit(item)).toBe(0);
    });

    it('returns 0 when item has no itemType', () => {
      const item = createMockInventoryItem({
        id: createItemId('no-type'),
        name: 'No Type Food',
        categoryId: createCategoryId('food'),
        unit: 'packages',
        itemType: undefined,
      });
      expect(getWaterRequirementPerUnit(item)).toBe(0);
    });

    it('returns 0 for template item with requiresWaterLiters = 0', () => {
      // Find a food template item that does NOT have requiresWaterLiters (it will be undefined, not 0)
      // We need an item whose template has no water requirement
      const item = createMockInventoryItem({
        id: createItemId('no-water-template'),
        name: 'Canned Beans',
        categoryId: createCategoryId('food'),
        unit: 'cans',
        itemType: createProductTemplateId('canned-beans'),
      });
      // canned-beans template should not require water
      expect(getWaterRequirementPerUnit(item)).toBe(0);
    });
  });

  describe('calculateTotalWaterAvailable - water detection branches', () => {
    it('detects water by itemType "bottled-water" specifically (kills L117 first branch)', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('bw-type'),
          name: 'My Liquid', // name does NOT contain "water"
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(5),
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(5);
    });

    it('detects water by itemType containing "water" (kills L118 second branch)', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('water-type'),
          name: 'My Liquid', // name does NOT contain "water"
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(7),
          unit: 'liters',
          itemType: createProductTemplateId('purified-water'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(7);
    });

    it('detects water by name containing "water" (kills L119 third branch)', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('water-name'),
          name: 'Spring Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(3),
          unit: 'liters',
          itemType: createProductTemplateId('some-other-thing'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(3);
    });

    it('detects water by name case-insensitively', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('upper-water'),
          name: 'SPRING WATER',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(4),
          unit: 'liters',
          itemType: createProductTemplateId('something'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(4);
    });

    it('detects water by mixed case name (kills case mutation)', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('mixed-water'),
          name: 'Filtered Water Supply',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(6),
          unit: 'liters',
          itemType: createProductTemplateId('non-water-type'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(6);
    });

    it('does NOT detect item without "water" in name or type', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('juice'),
          name: 'Orange Juice',
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(5),
          unit: 'liters',
          itemType: createProductTemplateId('juice'),
        }),
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(0);
    });
  });

  describe('calculateWaterRequirements - boundary mutations', () => {
    it('excludes items with quantity exactly 0', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('zero-qty'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: createQuantity(0),
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
        }),
      ];
      const result = calculateWaterRequirements(items);
      expect(result.itemsRequiringWater).toHaveLength(0);
      expect(result.totalWaterRequired).toBe(0);
    });
  });

  describe('calculateRecommendedWaterStorage - arithmetic mutations', () => {
    it('verifies adults multiplication not division', () => {
      // With ADULT_REQUIREMENT_MULTIPLIER = 1.0:
      // Correct: 4 * 1.0 * dailyWater * 1 = 4 * dailyWater
      // Mutant (division): 4 / 1.0 * dailyWater * 1 = 4 * dailyWater (same because multiplier is 1.0!)
      // So test with children to differentiate * vs / for CHILDREN_REQUIREMENT_MULTIPLIER
      const household2 = createMockHousehold({
        adults: 1,
        children: 4,
        supplyDurationDays: 1,
        useFreezer: false,
      });
      // Correct: (1 * 1.0 + 4 * 0.75) * 2 * 1 = (1 + 3) * 2 = 8
      // If children * was /: (1 * 1.0 + 4 / 0.75) * 2 * 1 = (1 + 5.333) * 2 = 12.667
      const result = calculateRecommendedWaterStorage(household2, 2);
      expect(result).toBe(8);
    });

    it('verifies multiplication with non-unit multiplier values', () => {
      const household = createMockHousehold({
        adults: 3,
        children: 2,
        supplyDurationDays: 5,
        useFreezer: false,
      });
      // (3 * 1.0 + 2 * 0.75) * 3 * 5 = (3 + 1.5) * 3 * 5 = 4.5 * 15 = 67.5
      expect(
        calculateRecommendedWaterStorage(household, DAILY_WATER_PER_PERSON),
      ).toBe(67.5);
    });

    it('uses custom children multiplier correctly', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 2,
        supplyDurationDays: 1,
        useFreezer: false,
      });
      // With custom childrenMultiplier = 0.5:
      // (1 * 1.0 + 2 * 0.5) * 1 * 1 = 2
      expect(calculateRecommendedWaterStorage(household, 1, 0.5)).toBe(2);
    });
  });

  describe('calculateTotalWaterNeeds', () => {
    it('combines drinking water and preparation water', () => {
      const pastaQuantity = createQuantity(randomQuantityFloat());
      const household = createMockHousehold({ children: 0 });
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'), // 1 L/kg
        }),
      ];
      const result = calculateTotalWaterNeeds(
        items,
        household,
        DAILY_WATER_PER_PERSON,
      );
      const expectedDrinking =
        household.adults *
        ADULT_REQUIREMENT_MULTIPLIER *
        DAILY_WATER_PER_PERSON *
        household.supplyDurationDays;
      const expectedPreparation = pastaQuantity * 1;
      expect(result.drinkingWater).toBe(expectedDrinking);
      expect(result.preparationWater).toBe(expectedPreparation);
      expect(result.totalWater).toBe(expectedDrinking + expectedPreparation);
    });
  });
});
