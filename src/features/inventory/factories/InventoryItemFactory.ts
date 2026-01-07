import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
  Unit,
  ProductTemplateId,
} from '@/shared/types';
import { createItemId, createCategoryId } from '@/shared/types';
import { calculateRecommendedQuantity } from '@/features/household/utils/calculations';
import { CUSTOM_ITEM_TYPE } from '@/shared/utils/constants';

/**
 * Base input for creating an inventory item.
 * Omits fields that are auto-generated: id, createdAt, updatedAt
 */
export type CreateItemInput = Omit<
  InventoryItem,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Options for creating an item from a template.
 */
export interface CreateFromTemplateOptions {
  /**
   * Custom name override (defaults to template's i18nKey translation)
   */
  name?: string;
  /**
   * Initial quantity (defaults to 0)
   */
  quantity?: number;
  /**
   * Custom expiration date override
   */
  expirationDate?: string;
  /**
   * Children requirement multiplier (defaults to 0.75)
   */
  childrenMultiplier?: number;
}

/**
 * Input for creating an item from form data.
 */
export interface CreateFromFormInput {
  name: string;
  itemType: string;
  categoryId: string;
  quantity: number;
  unit: Unit;
  recommendedQuantity: number;
  neverExpires: boolean;
  expirationDate?: string;
  location?: string;
  notes?: string;
  productTemplateId?: string;
  weightGrams?: number;
  caloriesPerUnit?: number;
  requiresWaterLiters?: number;
  capacityMah?: number;
  capacityWh?: number;
}

/**
 * Validation error thrown when item creation fails validation.
 */
export class InventoryItemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryItemValidationError';
  }
}

/**
 * Validates that a unit is a valid Unit type.
 */
function isValidUnit(unit: string): unit is Unit {
  const validUnits: Unit[] = [
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
  return validUnits.includes(unit as Unit);
}

/**
 * Validates numeric fields are non-negative.
 */
function validateNonNegative(
  value: number | undefined,
  fieldName: string,
): void {
  if (value !== undefined && value < 0) {
    throw new InventoryItemValidationError(
      `${fieldName} must be non-negative, got ${value}`,
    );
  }
}

/**
 * Validates required fields and constraints for item creation.
 */
function validateItemInput(input: CreateItemInput): void {
  // Required fields
  if (!input.name?.trim()) {
    throw new InventoryItemValidationError(
      'name is required and cannot be empty',
    );
  }

  if (!input.itemType?.trim()) {
    throw new InventoryItemValidationError(
      'itemType is required and cannot be empty',
    );
  }

  if (!input.categoryId) {
    throw new InventoryItemValidationError('categoryId is required');
  }

  if (input.quantity === undefined) {
    throw new InventoryItemValidationError('quantity is required');
  }

  if (input.unit === undefined) {
    throw new InventoryItemValidationError('unit is required');
  }

  if (input.recommendedQuantity === undefined) {
    throw new InventoryItemValidationError('recommendedQuantity is required');
  }

  // Numeric constraints
  validateNonNegative(input.quantity, 'quantity');
  validateNonNegative(input.recommendedQuantity, 'recommendedQuantity');
  validateNonNegative(input.weightGrams, 'weightGrams');
  validateNonNegative(input.caloriesPerUnit, 'caloriesPerUnit');
  validateNonNegative(input.requiresWaterLiters, 'requiresWaterLiters');
  validateNonNegative(input.capacityMah, 'capacityMah');
  validateNonNegative(input.capacityWh, 'capacityWh');

  // Unit validation
  if (!isValidUnit(input.unit)) {
    throw new InventoryItemValidationError(
      `Invalid unit: ${input.unit}. Must be one of the valid Unit types.`,
    );
  }

  // Expiration logic
  if (!input.neverExpires && !input.expirationDate) {
    throw new InventoryItemValidationError(
      'expirationDate is required when neverExpires is false',
    );
  }

  // If neverExpires is true, expirationDate should be undefined
  if (input.neverExpires && input.expirationDate) {
    throw new InventoryItemValidationError(
      'expirationDate must be undefined when neverExpires is true',
    );
  }
}

/**
 * Calculates expiration date from defaultExpirationMonths.
 * Returns ISO date string (YYYY-MM-DD) or undefined.
 */
function calculateExpirationDate(
  defaultExpirationMonths?: number,
): string | undefined {
  if (!defaultExpirationMonths) {
    return undefined;
  }

  const expDate = new Date();
  expDate.setMonth(expDate.getMonth() + defaultExpirationMonths);
  return expDate.toISOString().split('T')[0];
}

/**
 * Factory for creating InventoryItem instances with validation and consistent logic.
 */
export class InventoryItemFactory {
  /**
   * Main factory method that creates an InventoryItem from input data.
   * Validates all inputs and generates id, createdAt, updatedAt automatically.
   *
   * @param input - Item data (without id, createdAt, updatedAt)
   * @returns Validated InventoryItem
   * @throws InventoryItemValidationError if validation fails
   */
  static create(input: CreateItemInput): InventoryItem {
    validateItemInput(input);

    const now = new Date().toISOString();

    return {
      ...input,
      id: createItemId(crypto.randomUUID()),
      name: input.name.trim(),
      categoryId: createCategoryId(input.categoryId as string),
      createdAt: now,
      updatedAt: now,
      // Ensure expirationDate is undefined if neverExpires is true
      expirationDate: input.neverExpires ? undefined : input.expirationDate,
      // Ensure optional fields are undefined if not provided
      location: input.location?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      productTemplateId: input.productTemplateId || undefined,
    };
  }

  /**
   * Creates an InventoryItem from a RecommendedItemDefinition template.
   * Calculates recommended quantity based on household configuration.
   *
   * @param template - Recommended item definition
   * @param household - Household configuration for quantity calculation
   * @param options - Optional overrides (name, quantity, expirationDate, childrenMultiplier)
   * @returns InventoryItem created from template
   * @throws InventoryItemValidationError if validation fails
   */
  static createFromTemplate(
    template: RecommendedItemDefinition,
    household: HouseholdConfig,
    options: CreateFromTemplateOptions = {},
  ): InventoryItem {
    // Calculate recommended quantity
    const recommendedQuantity = calculateRecommendedQuantity(
      template,
      household,
      options.childrenMultiplier,
    );

    // Calculate expiration date if applicable
    const expirationDate =
      options.expirationDate ??
      calculateExpirationDate(template.defaultExpirationMonths);

    // Use provided name or template ID as itemType (name will be set by caller if needed)
    const itemType = template.id;

    return this.create({
      name: options.name ?? template.i18nKey, // Caller should translate this
      itemType,
      categoryId: createCategoryId(template.category),
      quantity: options.quantity ?? 0,
      unit: template.unit,
      recommendedQuantity,
      expirationDate,
      neverExpires: !template.defaultExpirationMonths,
      productTemplateId: template.id,
      weightGrams: template.weightGramsPerUnit,
      caloriesPerUnit: template.caloriesPerUnit,
      requiresWaterLiters: template.requiresWaterLiters,
      capacityMah: template.capacityMah,
      capacityWh: template.capacityWh,
    });
  }

  /**
   * Creates an InventoryItem from form submission data.
   * Validates and converts form data to InventoryItem.
   *
   * @param formData - Form input data
   * @returns InventoryItem created from form data
   * @throws InventoryItemValidationError if validation fails
   */
  static createFromFormData(formData: CreateFromFormInput): InventoryItem {
    return this.create({
      name: formData.name,
      itemType: formData.itemType || CUSTOM_ITEM_TYPE,
      categoryId: createCategoryId(formData.categoryId),
      quantity: formData.quantity,
      unit: formData.unit,
      recommendedQuantity: formData.recommendedQuantity,
      neverExpires: formData.neverExpires,
      expirationDate: formData.neverExpires
        ? undefined
        : formData.expirationDate,
      location: formData.location,
      notes: formData.notes,
      productTemplateId: formData.productTemplateId
        ? (formData.productTemplateId as ProductTemplateId)
        : undefined,
      weightGrams: formData.weightGrams,
      caloriesPerUnit: formData.caloriesPerUnit,
      requiresWaterLiters: formData.requiresWaterLiters,
      capacityMah: formData.capacityMah,
      capacityWh: formData.capacityWh,
    });
  }

  /**
   * Creates a custom (user-defined) InventoryItem.
   * Convenience method for creating items without templates.
   *
   * @param input - Item data (name, categoryId, quantity, unit, etc.)
   * @returns InventoryItem
   * @throws InventoryItemValidationError if validation fails
   */
  static createCustomItem(
    input: Omit<CreateItemInput, 'itemType'> & { itemType?: string },
  ): InventoryItem {
    return this.create({
      ...input,
      itemType: input.itemType || CUSTOM_ITEM_TYPE,
    });
  }

  /**
   * Creates a draft InventoryItem from a template for form initialization.
   * Draft items have empty id/timestamps and are used to pre-populate forms
   * before the user submits. The form will create a new item with a real id
   * when submitted.
   *
   * @param template - Recommended item definition
   * @param household - Household configuration for quantity calculation
   * @param options - Optional overrides (name, quantity, expirationDate, childrenMultiplier)
   * @returns Draft InventoryItem (with empty id/timestamps for form use)
   * @throws InventoryItemValidationError if validation fails
   */
  static createDraftFromTemplate(
    template: RecommendedItemDefinition,
    household: HouseholdConfig,
    options: CreateFromTemplateOptions = {},
  ): InventoryItem {
    // Create the full item data using the same logic as createFromTemplate
    const itemData = this.createFromTemplate(template, household, options);

    // Return as draft (empty id/timestamps - form will treat as new item)
    return {
      ...itemData,
      id: createItemId(''), // Empty id signals this is a draft/new item
      createdAt: '',
      updatedAt: '',
    };
  }
}
