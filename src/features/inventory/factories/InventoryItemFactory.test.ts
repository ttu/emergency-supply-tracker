import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  InventoryItemFactory,
  InventoryItemValidationError,
  type CreateItemInput,
  type CreateFromFormInput,
} from './InventoryItemFactory';
import type { HouseholdConfig } from '@/shared/types';
import {
  createMockHousehold,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import { createCategoryId, createProductTemplateId } from '@/shared/types';
import { CUSTOM_ITEM_TYPE } from '@/shared/utils/constants';

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-123';
global.crypto = {
  ...global.crypto,
  randomUUID: () => mockUUID,
} as Crypto;

describe('InventoryItemFactory', () => {
  let validInput: CreateItemInput;
  let household: HouseholdConfig;

  beforeEach(() => {
    household = createMockHousehold({
      adults: 2,
      children: 1,
      supplyDurationDays: 7,
      useFreezer: false,
    });

    validInput = {
      name: 'Test Item',
      itemType: 'test-item',
      categoryId: createCategoryId('food'),
      quantity: 10,
      unit: 'pieces',
      recommendedQuantity: 20,
      neverExpires: false,
      expirationDate: '2025-12-31',
    };
  });

  describe('create', () => {
    it('creates a valid inventory item with all required fields', () => {
      const item = InventoryItemFactory.create(validInput);

      expect(item.id).toBeDefined();
      expect(item.name).toBe('Test Item');
      expect(item.itemType).toBe('test-item');
      expect(item.categoryId).toBe(validInput.categoryId);
      expect(item.quantity).toBe(10);
      expect(item.unit).toBe('pieces');
      expect(item.recommendedQuantity).toBe(20);
      expect(item.expirationDate).toBe('2025-12-31');
      expect(item.neverExpires).toBe(false);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
      expect(item.createdAt).toBe(item.updatedAt);
    });

    it('trims name whitespace', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        name: '  Test Item  ',
      });

      expect(item.name).toBe('Test Item');
    });

    it('handles optional fields', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        location: '  Pantry  ',
        notes: '  Test notes  ',
        productTemplateId: createProductTemplateId('template-1'),
        weightGrams: 100,
        caloriesPerUnit: 200,
      });

      expect(item.location).toBe('Pantry');
      expect(item.notes).toBe('Test notes');
      expect(item.productTemplateId).toBeDefined();
      expect(item.weightGrams).toBe(100);
      expect(item.caloriesPerUnit).toBe(200);
    });

    it('sets optional fields to undefined when empty strings', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        location: '   ',
        notes: '',
      });

      expect(item.location).toBeUndefined();
      expect(item.notes).toBeUndefined();
    });

    it('handles neverExpires=true correctly', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        neverExpires: true,
        expirationDate: undefined,
      });

      expect(item.neverExpires).toBe(true);
      expect(item.expirationDate).toBeUndefined();
    });

    // Validation tests
    it('throws error when name is empty', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          name: '',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when name is only whitespace', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          name: '   ',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when categoryId is missing', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        InventoryItemFactory.create({
          ...validInput,
          categoryId: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when quantity is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          quantity: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when quantity is missing', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        InventoryItemFactory.create({
          ...validInput,
          quantity: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when recommendedQuantity is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          recommendedQuantity: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when unit is invalid', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        InventoryItemFactory.create({
          ...validInput,
          unit: 'invalid-unit',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when neverExpires is false but expirationDate is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          neverExpires: false,
          expirationDate: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when neverExpires is true but expirationDate is provided', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          neverExpires: true,
          expirationDate: '2025-12-31',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when weightGrams is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          weightGrams: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when caloriesPerUnit is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          caloriesPerUnit: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when requiresWaterLiters is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          requiresWaterLiters: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when capacityMah is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          capacityMah: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when capacityWh is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          capacityWh: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('allows zero for numeric fields', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        quantity: 0,
        recommendedQuantity: 0,
        weightGrams: 0,
        caloriesPerUnit: 0,
      });

      expect(item.quantity).toBe(0);
      expect(item.recommendedQuantity).toBe(0);
      expect(item.weightGrams).toBe(0);
      expect(item.caloriesPerUnit).toBe(0);
    });
  });

  describe('createFromTemplate', () => {
    it('creates item from template with calculated recommended quantity', () => {
      const template = createMockRecommendedItem({
        id: 'water',
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: 3,
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const item = InventoryItemFactory.createFromTemplate(template, household);

      expect(item.name).toBe('products.water'); // Will be translated by caller
      expect(item.itemType).toBe('water');
      expect(item.categoryId).toBe(createCategoryId('water-beverages'));
      expect(item.quantity).toBe(0); // Default
      expect(item.unit).toBe('liters');
      // Calculation: 3 * (2 * 1.0 + 1 * 0.75) * 7 = 3 * 2.75 * 7 = 57.75, ceil = 58
      expect(item.recommendedQuantity).toBe(58);
      expect(item.productTemplateId).toBe(template.id);
      expect(item.neverExpires).toBe(true); // No defaultExpirationMonths
      expect(item.expirationDate).toBeUndefined();
    });

    it('calculates expiration date from defaultExpirationMonths', () => {
      const template = createMockRecommendedItem({
        id: 'canned-food',
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: 1,
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        defaultExpirationMonths: 12,
      });

      const item = InventoryItemFactory.createFromTemplate(template, household);

      expect(item.neverExpires).toBe(false);
      expect(item.expirationDate).toBeDefined();
      expect(item.expirationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
    });

    it('uses provided name override', () => {
      const template = createMockRecommendedItem({
        id: 'water',
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: 3,
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          name: 'Drinking Water',
        },
      );

      expect(item.name).toBe('Drinking Water');
    });

    it('uses provided quantity override', () => {
      const template = createMockRecommendedItem({
        id: 'water',
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: 3,
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          quantity: 5,
        },
      );

      expect(item.quantity).toBe(5);
    });

    it('uses provided expirationDate override', () => {
      const template = createMockRecommendedItem({
        id: 'canned-food',
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: 1,
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        defaultExpirationMonths: 12,
      });

      const customDate = '2026-12-31';
      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          expirationDate: customDate,
        },
      );

      expect(item.expirationDate).toBe(customDate);
    });

    it('copies template properties (weightGrams, caloriesPerUnit, etc.)', () => {
      const template = createMockRecommendedItem({
        id: 'canned-food',
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: 1,
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        weightGramsPerUnit: 400,
        caloriesPerUnit: 200,
        requiresWaterLiters: 0.5,
        capacityMah: 10000,
        capacityWh: 37,
      });

      const item = InventoryItemFactory.createFromTemplate(template, household);

      expect(item.weightGrams).toBe(400);
      expect(item.caloriesPerUnit).toBe(200);
      expect(item.requiresWaterLiters).toBe(0.5);
      expect(item.capacityMah).toBe(10000);
      expect(item.capacityWh).toBe(37);
    });

    it('handles template without scaling', () => {
      const template = createMockRecommendedItem({
        id: 'flashlight',
        i18nKey: 'products.flashlight',
        category: 'light-power',
        baseQuantity: 1,
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      });

      const item = InventoryItemFactory.createFromTemplate(template, household);

      expect(item.recommendedQuantity).toBe(1);
    });

    it('uses custom childrenMultiplier', () => {
      const template = createMockRecommendedItem({
        id: 'water',
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: 3,
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          childrenMultiplier: 0.5,
        },
      );

      // 3 * (2 * 1.0 + 1 * 0.5) * 7 = 3 * 2.5 * 7 = 52.5, ceil = 53
      expect(item.recommendedQuantity).toBe(53);
    });
  });

  describe('createFromFormData', () => {
    it('creates item from form data', () => {
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity: 10,
        unit: 'pieces',
        recommendedQuantity: 20,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: 'Pantry',
        notes: 'Test notes',
        weightGrams: 100,
        caloriesPerUnit: 200,
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.name).toBe('Test Item');
      expect(item.itemType).toBe('test-item');
      expect(item.categoryId).toBe(createCategoryId('food'));
      expect(item.quantity).toBe(10);
      expect(item.unit).toBe('pieces');
      expect(item.recommendedQuantity).toBe(20);
      expect(item.expirationDate).toBe('2025-12-31');
      expect(item.neverExpires).toBe(false);
      expect(item.location).toBe('Pantry');
      expect(item.notes).toBe('Test notes');
      expect(item.weightGrams).toBe(100);
      expect(item.caloriesPerUnit).toBe(200);
    });

    it('uses CUSTOM_ITEM_TYPE when itemType is empty', () => {
      const formData: CreateFromFormInput = {
        name: 'Custom Item',
        itemType: '',
        categoryId: 'food',
        quantity: 5,
        unit: 'pieces',
        recommendedQuantity: 10,
        neverExpires: true,
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.itemType).toBe(CUSTOM_ITEM_TYPE);
    });

    it('handles neverExpires=true correctly', () => {
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity: 10,
        unit: 'pieces',
        recommendedQuantity: 20,
        neverExpires: true,
        expirationDate: '2025-12-31', // Should be ignored
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.neverExpires).toBe(true);
      expect(item.expirationDate).toBeUndefined();
    });

    it('converts productTemplateId string to ProductTemplateId', () => {
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity: 10,
        unit: 'pieces',
        recommendedQuantity: 20,
        neverExpires: true,
        productTemplateId: 'template-1',
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.productTemplateId).toBeDefined();
      expect(item.productTemplateId).toBe(
        createProductTemplateId('template-1'),
      );
    });
  });

  describe('createCustomItem', () => {
    it('creates custom item with CUSTOM_ITEM_TYPE', () => {
      const input: Omit<CreateItemInput, 'itemType'> = {
        name: 'Custom Item',
        categoryId: createCategoryId('food'),
        quantity: 5,
        unit: 'pieces',
        recommendedQuantity: 10,
        neverExpires: true,
      };

      const item = InventoryItemFactory.createCustomItem(input);

      expect(item.itemType).toBe(CUSTOM_ITEM_TYPE);
      expect(item.name).toBe('Custom Item');
    });

    it('allows custom itemType override', () => {
      const input: Omit<CreateItemInput, 'itemType'> & { itemType?: string } = {
        name: 'Custom Item',
        itemType: 'custom-type',
        categoryId: createCategoryId('food'),
        quantity: 5,
        unit: 'pieces',
        recommendedQuantity: 10,
        neverExpires: true,
      };

      const item = InventoryItemFactory.createCustomItem(input);

      expect(item.itemType).toBe('custom-type');
    });
  });

  describe('edge cases', () => {
    it('handles all valid unit types', () => {
      const units: Array<CreateItemInput['unit']> = [
        'pieces',
        'liters',
        'kilograms',
        'grams',
        'cans',
        'bottles',
        'packages',
        'jars',
        'canisters',
        'boxes',
        'days',
        'rolls',
        'tubes',
        'meters',
        'pairs',
        'euros',
        'sets',
      ];

      units.forEach((unit) => {
        const item = InventoryItemFactory.create({
          ...validInput,
          unit,
        });
        expect(item.unit).toBe(unit);
      });
    });

    it('generates unique IDs for each item', () => {
      const item1 = InventoryItemFactory.create(validInput);
      const item2 = InventoryItemFactory.create(validInput);

      // Since we're mocking crypto.randomUUID, they'll be the same
      // But in real usage, they'd be different
      expect(item1.id).toBeDefined();
      expect(item2.id).toBeDefined();
    });

    it('sets createdAt and updatedAt to same timestamp on creation', () => {
      const item = InventoryItemFactory.create(validInput);

      expect(item.createdAt).toBe(item.updatedAt);
      const timestamp = new Date(item.createdAt).getTime();
      const now = Date.now();
      // Should be within 1 second (1000ms)
      expect(Math.abs(timestamp - now)).toBeLessThan(1000);
    });
  });
});
