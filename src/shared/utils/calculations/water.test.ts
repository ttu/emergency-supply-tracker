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
      expect(validateWaterRequirement(NaN)).toBe(
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

    it('returns template water requirement for items with productTemplateId', () => {
      const item = createMockInventoryItem({
        id: createItemId('1'),
        name: 'My Pasta',
        categoryId: createCategoryId('food'),
        unit: 'kilograms',
        productTemplateId: createProductTemplateId('pasta'),
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
        productTemplateId: createProductTemplateId('pasta'),
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
      const pastaQuantity = randomQuantityFloat();
      const riceQuantity = randomQuantityFloat();
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
          productTemplateId: createProductTemplateId('pasta'), // 1 L/kg
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Rice',
          categoryId: createCategoryId('food'),
          quantity: riceQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
          productTemplateId: createProductTemplateId('rice'), // 1.5 L/kg
        }),
      ];
      const expected = pastaQuantity * 1 + riceQuantity * 1.5;
      // Use toBeCloseTo() to handle potential floating-point precision issues with random values
      expect(calculateTotalWaterRequired(items)).toBeCloseTo(expected, 10);
    });

    it('ignores items without water requirements', () => {
      const pastaQuantity = randomQuantityFloat();
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
          productTemplateId: createProductTemplateId('pasta'),
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
          quantity: water1,
          unit: 'liters',
          productTemplateId: createProductTemplateId('bottled-water'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Tap Water Container',
          categoryId: createCategoryId('water-beverages'),
          quantity: water2,
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
          quantity: waterQuantity,
          unit: 'liters',
          productTemplateId: createProductTemplateId('bottled-water'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Long Life Milk',
          categoryId: createCategoryId('water-beverages'),
          unit: 'liters',
          productTemplateId: createProductTemplateId('long-life-milk'),
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
          quantity: 10,
          unit: 'liters',

          productTemplateId: createProductTemplateId('bottled-water'),
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
          quantity: 10,
          unit: 'bottles', // Not liters

          productTemplateId: createProductTemplateId('bottled-water'),
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
      const pastaQuantity = randomQuantityFloat();
      const waterQuantity = pastaQuantity * 1 + randomQuantitySmall(); // More than needed
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Bottled Water',
          categoryId: createCategoryId('water-beverages'),
          quantity: waterQuantity,
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
          productTemplateId: createProductTemplateId('bottled-water'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
          productTemplateId: createProductTemplateId('pasta'), // 1 L/kg
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
      const pastaQuantity = faker.number.float({
        min: 2,
        max: 10,
        fractionDigits: 1,
      });
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
          quantity: waterQuantity,
          unit: 'liters',
          itemType: createProductTemplateId('bottled-water'),
          productTemplateId: createProductTemplateId('bottled-water'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
          productTemplateId: createProductTemplateId('pasta'), // 1 L/kg
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
      const pastaQuantity = randomQuantityFloat();
      const riceQuantity = randomQuantityFloat();
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'My Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
          productTemplateId: createProductTemplateId('pasta'),
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          name: 'My Rice',
          categoryId: createCategoryId('food'),
          quantity: riceQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'),
          productTemplateId: createProductTemplateId('rice'),
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

  describe('calculateTotalWaterNeeds', () => {
    it('combines drinking water and preparation water', () => {
      const pastaQuantity = randomQuantityFloat();
      const household = createMockHousehold({ children: 0 });
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          productTemplateId: createProductTemplateId('pasta'), // 1 L/kg
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
