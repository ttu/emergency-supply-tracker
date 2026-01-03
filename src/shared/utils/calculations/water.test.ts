import { describe, it, expect } from '@jest/globals';
import {
  validateWaterRequirement,
  getWaterRequirementPerUnit,
  calculateTotalWaterRequired,
  calculateTotalWaterAvailable,
  calculateWaterRequirements,
  calculateRecommendedWaterStorage,
  calculateTotalWaterNeeds,
} from './water';
import type { InventoryItem, HouseholdConfig } from '@/shared/types';
import { DAILY_WATER_PER_PERSON } from '@/shared/utils/constants';

describe('water calculations', () => {
  describe('validateWaterRequirement', () => {
    it('returns null for undefined value', () => {
      expect(validateWaterRequirement(undefined)).toBeNull();
    });

    it('returns null for null value', () => {
      expect(validateWaterRequirement(null)).toBeNull();
    });

    it('returns null for valid positive number', () => {
      expect(validateWaterRequirement(1.5)).toBeNull();
      expect(validateWaterRequirement(0.1)).toBeNull();
      expect(validateWaterRequirement(10)).toBeNull();
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
      const item: InventoryItem = {
        id: '1',
        name: 'Crackers',
        categoryId: 'food',
        quantity: 2,
        unit: 'packages',
        recommendedQuantity: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(getWaterRequirementPerUnit(item)).toBe(0);
    });

    it('returns custom water requirement if set on item', () => {
      const item: InventoryItem = {
        id: '1',
        name: 'Instant Noodles',
        categoryId: 'food',
        quantity: 5,
        unit: 'packages',
        recommendedQuantity: 5,
        requiresWaterLiters: 0.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(getWaterRequirementPerUnit(item)).toBe(0.5);
    });

    it('returns template water requirement for items with productTemplateId', () => {
      const item: InventoryItem = {
        id: '1',
        name: 'My Pasta',
        categoryId: 'food',
        quantity: 2,
        unit: 'kilograms',
        recommendedQuantity: 1,
        productTemplateId: 'pasta',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(getWaterRequirementPerUnit(item)).toBe(1.0);
    });

    it('returns template water requirement for items with matching itemType', () => {
      const item: InventoryItem = {
        id: '1',
        name: 'My Rice',
        categoryId: 'food',
        quantity: 1,
        unit: 'kilograms',
        recommendedQuantity: 1,
        itemType: 'Rice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(getWaterRequirementPerUnit(item)).toBe(1.5);
    });

    it('prefers custom water requirement over template', () => {
      const item: InventoryItem = {
        id: '1',
        name: 'My Pasta',
        categoryId: 'food',
        quantity: 2,
        unit: 'kilograms',
        recommendedQuantity: 1,
        productTemplateId: 'pasta',
        requiresWaterLiters: 2.0, // Custom value overrides template's 1.0
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(getWaterRequirementPerUnit(item)).toBe(2.0);
    });
  });

  describe('calculateTotalWaterRequired', () => {
    it('returns 0 for empty items array', () => {
      expect(calculateTotalWaterRequired([])).toBe(0);
    });

    it('calculates total water required for items', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          categoryId: 'food',
          quantity: 2,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'pasta', // 1.0 L/kg
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Rice',
          categoryId: 'food',
          quantity: 1,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'rice', // 1.5 L/kg
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      // 2 * 1.0 + 1 * 1.5 = 3.5
      expect(calculateTotalWaterRequired(items)).toBe(3.5);
    });

    it('ignores items without water requirements', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Crackers',
          categoryId: 'food',
          quantity: 5,
          unit: 'packages',
          recommendedQuantity: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Pasta',
          categoryId: 'food',
          quantity: 1,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'pasta',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      expect(calculateTotalWaterRequired(items)).toBe(1.0);
    });
  });

  describe('calculateTotalWaterAvailable', () => {
    it('returns 0 for empty items array', () => {
      expect(calculateTotalWaterAvailable([])).toBe(0);
    });

    it('sums water from bottled-water items in liters', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Bottled Water',
          categoryId: 'water-beverages',
          quantity: 10,
          unit: 'liters',
          recommendedQuantity: 9,
          productTemplateId: 'bottled-water',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Tap Water Container',
          categoryId: 'water-beverages',
          quantity: 5,
          unit: 'liters',
          recommendedQuantity: 5,
          itemType: 'Bottled Water',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(15);
    });

    it('ignores non-water items in water-beverages category', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Bottled Water',
          categoryId: 'water-beverages',
          quantity: 10,
          unit: 'liters',
          recommendedQuantity: 9,
          productTemplateId: 'bottled-water',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Long Life Milk',
          categoryId: 'water-beverages',
          quantity: 5,
          unit: 'liters',
          recommendedQuantity: 2,
          productTemplateId: 'long-life-milk',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(10);
    });

    it('ignores water items in wrong category', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Bottled Water',
          categoryId: 'food', // Wrong category
          quantity: 10,
          unit: 'liters',
          recommendedQuantity: 9,
          productTemplateId: 'bottled-water',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(0);
    });

    it('ignores water items not in liters', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Bottled Water',
          categoryId: 'water-beverages',
          quantity: 10,
          unit: 'bottles', // Not liters
          recommendedQuantity: 9,
          productTemplateId: 'bottled-water',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      expect(calculateTotalWaterAvailable(items)).toBe(0);
    });
  });

  describe('calculateWaterRequirements', () => {
    it('returns correct values when no water required', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Crackers',
          categoryId: 'food',
          quantity: 5,
          unit: 'packages',
          recommendedQuantity: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateWaterRequirements(items);
      expect(result.totalWaterRequired).toBe(0);
      expect(result.hasEnoughWater).toBe(true);
      expect(result.waterShortfall).toBe(0);
      expect(result.itemsRequiringWater).toHaveLength(0);
    });

    it('returns correct values when enough water available', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Bottled Water',
          categoryId: 'water-beverages',
          quantity: 20,
          unit: 'liters',
          recommendedQuantity: 18,
          productTemplateId: 'bottled-water',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Pasta',
          categoryId: 'food',
          quantity: 2,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'pasta', // 1.0 L/kg
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateWaterRequirements(items);
      expect(result.totalWaterRequired).toBe(2); // 2kg * 1.0L
      expect(result.totalWaterAvailable).toBe(20);
      expect(result.hasEnoughWater).toBe(true);
      expect(result.waterShortfall).toBe(0);
      expect(result.itemsRequiringWater).toHaveLength(1);
    });

    it('returns correct shortfall when not enough water', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Bottled Water',
          categoryId: 'water-beverages',
          quantity: 5,
          unit: 'liters',
          recommendedQuantity: 18,
          productTemplateId: 'bottled-water',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Pasta',
          categoryId: 'food',
          quantity: 10,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'pasta', // 1.0 L/kg
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateWaterRequirements(items);
      expect(result.totalWaterRequired).toBe(10); // 10kg * 1.0L
      expect(result.totalWaterAvailable).toBe(5);
      expect(result.hasEnoughWater).toBe(false);
      expect(result.waterShortfall).toBe(5);
    });

    it('provides detailed items requiring water', () => {
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'My Pasta',
          categoryId: 'food',
          quantity: 2,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'pasta',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'My Rice',
          categoryId: 'food',
          quantity: 3,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'rice',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateWaterRequirements(items);
      expect(result.itemsRequiringWater).toHaveLength(2);
      expect(result.itemsRequiringWater).toContainEqual({
        itemId: '1',
        itemName: 'My Pasta',
        quantity: 2,
        waterPerUnit: 1.0,
        totalWaterRequired: 2.0,
      });
      expect(result.itemsRequiringWater).toContainEqual({
        itemId: '2',
        itemName: 'My Rice',
        quantity: 3,
        waterPerUnit: 1.5,
        totalWaterRequired: 4.5,
      });
    });
  });

  describe('calculateRecommendedWaterStorage', () => {
    it('calculates for single adult', () => {
      const household: HouseholdConfig = {
        adults: 1,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      };
      expect(
        calculateRecommendedWaterStorage(household, DAILY_WATER_PER_PERSON),
      ).toBe(9); // 1 * 3 * 3
    });

    it('calculates for family with children', () => {
      const household: HouseholdConfig = {
        adults: 2,
        children: 2,
        supplyDurationDays: 3,
        useFreezer: false,
      };
      // (2 * 1.0 + 2 * 0.75) * 3 * 3 = 3.5 * 3 * 3 = 31.5
      expect(
        calculateRecommendedWaterStorage(household, DAILY_WATER_PER_PERSON),
      ).toBe(31.5);
    });

    it('scales with supply duration', () => {
      const household: HouseholdConfig = {
        adults: 1,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      };
      expect(
        calculateRecommendedWaterStorage(household, DAILY_WATER_PER_PERSON),
      ).toBe(21); // 1 * 3 * 7
    });
  });

  describe('calculateTotalWaterNeeds', () => {
    it('combines drinking water and preparation water', () => {
      const household: HouseholdConfig = {
        adults: 2,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      };
      const items: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          categoryId: 'food',
          quantity: 2,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'pasta', // 1.0 L/kg
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateTotalWaterNeeds(
        items,
        household,
        DAILY_WATER_PER_PERSON,
      );
      expect(result.drinkingWater).toBe(18); // 2 * 3 * 3
      expect(result.preparationWater).toBe(2); // 2kg * 1.0L
      expect(result.totalWater).toBe(20);
    });
  });
});
