import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  InventoryItemFactory,
  InventoryItemValidationError,
  type CreateItemInput,
  type CreateFromFormInput,
} from './InventoryItemFactory';
import {
  createCategoryId,
  createProductTemplateId,
  createItemId,
  createDateOnly,
  type HouseholdConfig,
  type ProductTemplateId,
} from '@/shared/types';
import {
  createMockHousehold,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import { randomQuantitySmall } from '@/shared/utils/test/faker-helpers';
import { faker } from '@faker-js/faker';
import {
  CUSTOM_ITEM_TYPE,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-123';
vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
  mockUUID as `${string}-${string}-${string}-${string}-${string}`,
);

describe('InventoryItemFactory', () => {
  let validInput: CreateItemInput;
  let household: HouseholdConfig;

  beforeEach(() => {
    household = createMockHousehold();

    const quantity = randomQuantitySmall();
    validInput = {
      name: 'Test Item',
      itemType: createProductTemplateId('test-item'),
      categoryId: createCategoryId('food'),
      quantity,
      unit: 'pieces',
      recommendedQuantity: quantity + randomQuantitySmall(),
      neverExpires: false,
      expirationDate: createDateOnly('2025-12-31'),
    };
  });

  describe('create', () => {
    it('creates a valid inventory item with all required fields', () => {
      const item = InventoryItemFactory.create(validInput);

      expect(item.id).toBeDefined();
      expect(item.name).toBe('Test Item');
      expect(item.itemType).toBe('test-item');
      expect(item.categoryId).toBe(validInput.categoryId);
      expect(item.quantity).toBe(validInput.quantity);
      expect(item.unit).toBe('pieces');
      expect(item.recommendedQuantity).toBe(validInput.recommendedQuantity);
      expect(item.expirationDate).toBe(createDateOnly('2025-12-31'));
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
      const weightGrams = faker.number.int({ min: 50, max: 500 });
      const caloriesPerUnit = faker.number.int({ min: 100, max: 500 });
      const item = InventoryItemFactory.create({
        ...validInput,
        location: '  Pantry  ',
        notes: '  Test notes  ',
        productTemplateId: createProductTemplateId('template-1'),
        weightGrams,
        caloriesPerUnit,
      });

      expect(item.location).toBe('Pantry');
      expect(item.notes).toBe('Test notes');
      expect(item.productTemplateId).toBeDefined();
      expect(item.weightGrams).toBe(weightGrams);
      expect(item.caloriesPerUnit).toBe(caloriesPerUnit);
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

    it('throws error when itemType is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          itemType: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when itemType is empty', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          itemType: '',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when itemType is only whitespace', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          itemType: '   ',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when categoryId is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
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
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          quantity: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when quantity is undefined', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
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

    it('throws error when unit is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          unit: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when unit is undefined', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          unit: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when unit is invalid', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
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
          expirationDate: createDateOnly('2025-12-31'),
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
        id: createProductTemplateId('water'),
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
      // Calculate expected: baseQuantity * (adults * 1 + children * CHILDREN_REQUIREMENT_MULTIPLIER) * days
      const expected = Math.ceil(
        3 *
          (household.adults * 1 +
            household.children * CHILDREN_REQUIREMENT_MULTIPLIER) *
          household.supplyDurationDays,
      );
      expect(item.recommendedQuantity).toBe(expected);
      expect(item.productTemplateId).toBe(template.id);
      expect(item.neverExpires).toBe(true); // No defaultExpirationMonths
      expect(item.expirationDate).toBeUndefined();
    });

    it('calculates expiration date from defaultExpirationMonths', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('canned-food'),
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
        id: createProductTemplateId('water'),
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
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: 3,
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const quantity = randomQuantitySmall();
      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          quantity,
        },
      );

      expect(item.quantity).toBe(quantity);
    });

    it('uses provided expirationDate override', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('canned-food'),
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: 1,
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        defaultExpirationMonths: 12,
      });

      const customDate = createDateOnly('2026-12-31');
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
        id: createProductTemplateId('canned-food'),
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
        id: createProductTemplateId('flashlight'),
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
        id: createProductTemplateId('water'),
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

      // Calculate expected: baseQuantity * (adults * 1 + children * customMultiplier) * days
      const expected = Math.ceil(
        3 *
          (household.adults * 1 + household.children * 0.5) *
          household.supplyDurationDays,
      );
      expect(item.recommendedQuantity).toBe(expected);
    });
  });

  describe('createDraftFromTemplate', () => {
    it('creates draft item with empty id and timestamps', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: 3,
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const draft = InventoryItemFactory.createDraftFromTemplate(
        template,
        household,
      );

      // Draft should have empty id/timestamps
      expect(draft.id).toBe(createItemId(''));
      expect(draft.createdAt).toBe('');
      expect(draft.updatedAt).toBe('');

      // But should have all other fields calculated correctly
      expect(draft.name).toBe('products.water');
      expect(draft.itemType).toBe('water');
      expect(draft.categoryId).toBe(createCategoryId('water-beverages'));
      // Same calculation as createFromTemplate
      const fullItem = InventoryItemFactory.createFromTemplate(
        template,
        household,
      );
      expect(draft.recommendedQuantity).toBe(fullItem.recommendedQuantity);
    });

    it('creates draft with same data as createFromTemplate except id/timestamps', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('flashlight'),
        i18nKey: 'products.flashlight',
        category: 'light-power',
        baseQuantity: 1,
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      });

      const fullItem = InventoryItemFactory.createFromTemplate(
        template,
        household,
      );
      const draft = InventoryItemFactory.createDraftFromTemplate(
        template,
        household,
      );

      // Compare all fields except id/timestamps
      expect(draft.name).toBe(fullItem.name);
      expect(draft.itemType).toBe(fullItem.itemType);
      expect(draft.categoryId).toBe(fullItem.categoryId);
      expect(draft.quantity).toBe(fullItem.quantity);
      expect(draft.unit).toBe(fullItem.unit);
      expect(draft.recommendedQuantity).toBe(fullItem.recommendedQuantity);

      // But id/timestamps should be different
      expect(draft.id).not.toBe(fullItem.id);
      expect(draft.id).toBe(createItemId(''));
      expect(draft.createdAt).toBe('');
      expect(draft.updatedAt).toBe('');
    });

    it('respects options like createFromTemplate', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: 3,
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const quantity = randomQuantitySmall();
      const draft = InventoryItemFactory.createDraftFromTemplate(
        template,
        household,
        {
          name: 'Custom Water',
          quantity,
        },
      );

      expect(draft.name).toBe('Custom Water');
      expect(draft.quantity).toBe(quantity);
      expect(draft.id).toBe(createItemId(''));
    });
  });

  describe('createFromFormData', () => {
    it('creates item from form data', () => {
      const quantity = randomQuantitySmall();
      const recommendedQuantity = quantity + randomQuantitySmall();
      const weightGrams = faker.number.int({ min: 50, max: 500 });
      const caloriesPerUnit = faker.number.int({ min: 100, max: 500 });
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        recommendedQuantity,
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
        location: 'Pantry',
        notes: 'Test notes',
        weightGrams,
        caloriesPerUnit,
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.name).toBe('Test Item');
      expect(item.itemType).toBe('test-item');
      expect(item.categoryId).toBe(createCategoryId('food'));
      expect(item.quantity).toBe(quantity);
      expect(item.unit).toBe('pieces');
      expect(item.recommendedQuantity).toBe(recommendedQuantity);
      expect(item.expirationDate).toBe(createDateOnly('2025-12-31'));
      expect(item.neverExpires).toBe(false);
      expect(item.location).toBe('Pantry');
      expect(item.notes).toBe('Test notes');
      expect(item.weightGrams).toBe(weightGrams);
      expect(item.caloriesPerUnit).toBe(caloriesPerUnit);
    });

    it('uses CUSTOM_ITEM_TYPE when itemType is empty', () => {
      const quantity = randomQuantitySmall();
      const recommendedQuantity = quantity + randomQuantitySmall();
      const formData: CreateFromFormInput = {
        name: 'Custom Item',
        itemType: '',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        recommendedQuantity,
        neverExpires: true,
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.itemType).toBe(CUSTOM_ITEM_TYPE);
    });

    it('handles neverExpires=true correctly', () => {
      const quantity = randomQuantitySmall();
      const recommendedQuantity = quantity + randomQuantitySmall();
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        recommendedQuantity,
        neverExpires: true,
        expirationDate: createDateOnly('2025-12-31'), // Should be ignored
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.neverExpires).toBe(true);
      expect(item.expirationDate).toBeUndefined();
    });

    it('handles empty expiration date string by converting to undefined', () => {
      const quantity = randomQuantitySmall();
      const recommendedQuantity = quantity + randomQuantitySmall();
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        recommendedQuantity,
        neverExpires: false,
        // @ts-expect-error - Testing invalid input (empty string)
        expirationDate: '', // Empty string - this will fail validation, but tests the code path
      };

      // This should throw validation error, but tests that empty string is converted to undefined
      expect(() => {
        InventoryItemFactory.createFromFormData(formData);
      }).toThrow('expirationDate is required when neverExpires is false');
    });

    it('handles whitespace-only expiration date string', () => {
      const quantity = randomQuantitySmall();
      const recommendedQuantity = quantity + randomQuantitySmall();
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        recommendedQuantity,
        neverExpires: false,
        // @ts-expect-error - Testing invalid input (whitespace-only string)
        expirationDate: '   ', // Whitespace-only string should be treated as empty
      };

      // This should throw validation error, but tests that whitespace is trimmed
      expect(() => {
        InventoryItemFactory.createFromFormData(formData);
      }).toThrow('expirationDate is required when neverExpires is false');
    });

    it('converts productTemplateId string to ProductTemplateId', () => {
      const quantity = randomQuantitySmall();
      const recommendedQuantity = quantity + randomQuantitySmall();
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        recommendedQuantity,
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
      const quantity = randomQuantitySmall();
      const recommendedQuantity = quantity + randomQuantitySmall();
      const input: Omit<CreateItemInput, 'itemType'> = {
        name: 'Custom Item',
        categoryId: createCategoryId('food'),
        quantity,
        unit: 'pieces',
        recommendedQuantity,
        neverExpires: true,
      };

      const item = InventoryItemFactory.createCustomItem(input);

      expect(item.itemType).toBe(CUSTOM_ITEM_TYPE);
      expect(item.name).toBe('Custom Item');
    });

    it('allows custom itemType override', () => {
      const quantity = randomQuantitySmall();
      const recommendedQuantity = quantity + randomQuantitySmall();
      const input: Omit<CreateItemInput, 'itemType'> & {
        itemType?: ProductTemplateId | 'custom';
      } = {
        name: 'Custom Item',
        // @ts-expect-error - Testing custom string behavior
        itemType: 'custom-type', // Testing custom string behavior
        categoryId: createCategoryId('food'),
        quantity,
        unit: 'pieces',
        recommendedQuantity,
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

    it('generates IDs for each item', () => {
      const item1 = InventoryItemFactory.create(validInput);
      const item2 = InventoryItemFactory.create(validInput);

      expect(item1.id).toBeDefined();
      expect(item2.id).toBeDefined();
      // Note: With mocked crypto.randomUUID, IDs will be the same
      // In real usage, crypto.randomUUID() generates unique IDs
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
