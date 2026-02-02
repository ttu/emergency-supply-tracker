import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
  Unit,
  ProductTemplateId,
  DateOnly,
  Quantity,
  ProductTemplate,
} from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createDateOnly,
  createQuantity,
} from '@/shared/types';
import { CUSTOM_ITEM_TYPE } from '@/shared/utils/constants';
import { isTemplateId } from '@/shared/utils/storage/localStorage';
import { isValidUnit } from '@/shared/utils/validation/unitValidation';

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
  quantity?: Quantity;
  /**
   * Custom expiration date override
   */
  expirationDate?: DateOnly;
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
  neverExpires: boolean;
  expirationDate?: DateOnly;
  purchaseDate?: DateOnly;
  location?: string;
  notes?: string;
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

  // Numeric constraints
  validateNonNegative(input.quantity, 'quantity');
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
 * Returns DateOnly or undefined.
 */
function calculateExpirationDate(
  defaultExpirationMonths?: number,
): DateOnly | undefined {
  if (!defaultExpirationMonths) {
    return undefined;
  }

  const expDate = new Date();
  expDate.setMonth(expDate.getMonth() + defaultExpirationMonths);
  // Use local date formatting to match backupReminder.ts and status.ts
  const year = expDate.getFullYear();
  const month = String(expDate.getMonth() + 1).padStart(2, '0');
  const day = String(expDate.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  return createDateOnly(dateString);
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
      categoryId: createCategoryId(input.categoryId),
      createdAt: now,
      updatedAt: now,
      // Ensure expirationDate is undefined if neverExpires is true
      expirationDate: input.neverExpires ? undefined : input.expirationDate,
      // Ensure optional fields are undefined if not provided
      location: input.location?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
    };
  }

  /**
   * Creates an InventoryItem from a RecommendedItemDefinition template.
   * Recommended quantity is calculated dynamically at runtime, not stored.
   *
   * @param template - Recommended item definition
   * @param _household - Household configuration (kept for API compatibility, not currently used)
   * @param options - Optional overrides (name, quantity, expirationDate, childrenMultiplier)
   * @returns InventoryItem created from template
   * @throws InventoryItemValidationError if validation fails
   */
  static createFromTemplate(
    template: RecommendedItemDefinition,
    _household: HouseholdConfig,
    options: CreateFromTemplateOptions = {},
  ): InventoryItem {
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
      quantity: options.quantity ?? createQuantity(0),
      unit: template.unit,
      expirationDate,
      neverExpires: !template.defaultExpirationMonths,
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
   * Recommended quantity is calculated dynamically at runtime, not stored.
   *
   * @param formData - Form input data
   * @returns InventoryItem created from form data
   * @throws InventoryItemValidationError if validation fails
   */
  static createFromFormData(formData: CreateFromFormInput): InventoryItem {
    const itemType: ProductTemplateId | 'custom' =
      formData.itemType && isTemplateId(formData.itemType)
        ? createProductTemplateId(formData.itemType)
        : CUSTOM_ITEM_TYPE;

    return this.create({
      name: formData.name,
      itemType,
      categoryId: createCategoryId(formData.categoryId),
      quantity: createQuantity(formData.quantity),
      unit: formData.unit,
      neverExpires: formData.neverExpires,
      expirationDate: (() => {
        if (formData.neverExpires) {
          return undefined;
        }
        if (formData.expirationDate && formData.expirationDate.trim()) {
          return createDateOnly(formData.expirationDate);
        }
        return undefined;
      })(),
      purchaseDate:
        formData.purchaseDate && formData.purchaseDate.trim()
          ? createDateOnly(formData.purchaseDate)
          : undefined,
      location: formData.location,
      notes: formData.notes,
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
    input: Omit<CreateItemInput, 'itemType'> & {
      itemType?: ProductTemplateId | 'custom';
    },
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

  /**
   * Creates a draft InventoryItem from a custom ProductTemplate for form initialization.
   * Custom templates are lightweight (name, category, unit) and don't have
   * quantity/scaling rules like RecommendedItemDefinitions.
   *
   * @param template - Custom product template
   * @param options - Optional overrides (quantity)
   * @returns Draft InventoryItem (with empty id/timestamps for form use)
   */
  static createDraftFromCustomTemplate(
    template: ProductTemplate,
    options: { quantity?: number } = {},
  ): InventoryItem {
    const unit: Unit =
      template.defaultUnit && isValidUnit(template.defaultUnit)
        ? template.defaultUnit
        : 'pieces';

    // Return as draft (empty id/timestamps - form will treat as new item)
    return {
      id: createItemId(''), // Empty id signals this is a draft/new item
      name: template.name || '',
      itemType: template.id, // Use the template ID as itemType
      categoryId: createCategoryId(template.category),
      quantity: options.quantity ?? 0,
      unit,
      neverExpires: true, // Custom templates don't have default expiration
      createdAt: '',
      updatedAt: '',
    };
  }
}
