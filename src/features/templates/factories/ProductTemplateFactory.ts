import type {
  ProductTemplate,
  StandardCategoryId,
  Unit,
  ProductKind,
} from '@/shared/types';
import { createProductTemplateId } from '@/shared/types';

/**
 * Input for creating a custom product template.
 * Omits fields that are auto-generated: id, createdAt, updatedAt
 */
export type CreateProductTemplateInput = Omit<
  ProductTemplate,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Validation error thrown when template creation fails validation.
 */
export class ProductTemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductTemplateValidationError';
  }
}

/**
 * Validates that a unit is a valid Unit type.
 */
function isValidUnit(unit: string | undefined): unit is Unit {
  if (!unit) return false;
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
 * Validates that a category is a valid StandardCategoryId or non-empty string.
 */
function isValidCategory(
  category: StandardCategoryId | string | undefined,
): boolean {
  if (!category) return false;
  if (typeof category !== 'string') return false;

  // Check if it's a standard category
  const validStandardCategories: StandardCategoryId[] = [
    'water-beverages',
    'food',
    'cooking-heat',
    'light-power',
    'communication-info',
    'medical-health',
    'hygiene-sanitation',
    'tools-supplies',
    'cash-documents',
  ];
  if (validStandardCategories.includes(category as StandardCategoryId)) {
    return true;
  }

  // Or it's a custom category (non-empty string)
  return category.trim().length > 0;
}

/**
 * Validates that a ProductKind is valid.
 */
function isValidProductKind(kind: string | undefined): kind is ProductKind {
  if (!kind) return false;
  const validKinds: ProductKind[] = [
    'food',
    'water',
    'medicine',
    'energy',
    'hygiene',
    'device',
    'other',
  ];
  return validKinds.includes(kind as ProductKind);
}

/**
 * Validates template input.
 */
function validateTemplateInput(input: CreateProductTemplateInput): void {
  // Validate name OR i18nKey (mutually exclusive)
  const hasName = input.name && input.name.trim().length > 0;
  const hasI18nKey = input.i18nKey && input.i18nKey.trim().length > 0;

  if (!hasName && !hasI18nKey) {
    throw new ProductTemplateValidationError(
      'Either name or i18nKey is required',
    );
  }

  if (hasName && hasI18nKey) {
    throw new ProductTemplateValidationError(
      'Cannot specify both name and i18nKey. Use name for custom templates, i18nKey for built-in templates.',
    );
  }

  // Validate category
  if (!isValidCategory(input.category)) {
    throw new ProductTemplateValidationError(
      'category is required and must be a valid StandardCategoryId or non-empty string',
    );
  }

  // Validate defaultUnit if provided
  if (input.defaultUnit && !isValidUnit(input.defaultUnit)) {
    throw new ProductTemplateValidationError(
      `Invalid defaultUnit: ${input.defaultUnit}. Must be a valid Unit type.`,
    );
  }

  // Validate kind if provided
  if (input.kind && !isValidProductKind(input.kind)) {
    throw new ProductTemplateValidationError(
      `Invalid kind: ${input.kind}. Must be a valid ProductKind.`,
    );
  }

  // Validate isBuiltIn and isCustom flags
  if (input.isBuiltIn && input.isCustom) {
    throw new ProductTemplateValidationError(
      'Template cannot be both built-in and custom',
    );
  }

  // Custom templates must have name (not i18nKey)
  if (input.isCustom && !hasName) {
    throw new ProductTemplateValidationError(
      'Custom templates must have a name (not i18nKey)',
    );
  }

  // Built-in templates should have i18nKey (not name)
  if (input.isBuiltIn && !hasI18nKey) {
    throw new ProductTemplateValidationError(
      'Built-in templates should have i18nKey (not name)',
    );
  }
}

/**
 * Factory for creating ProductTemplate instances with validation.
 */
export class ProductTemplateFactory {
  /**
   * Creates a custom product template from input data.
   * Validates all inputs and generates id, createdAt, updatedAt automatically.
   *
   * @param input - Template data (without id, createdAt, updatedAt)
   * @returns Validated ProductTemplate
   * @throws ProductTemplateValidationError if validation fails
   */
  static createCustom(input: CreateProductTemplateInput): ProductTemplate {
    // Ensure isCustom is true and isBuiltIn is false
    const templateInput: CreateProductTemplateInput = {
      ...input,
      isCustom: true,
      isBuiltIn: false,
    };

    validateTemplateInput(templateInput);

    const now = new Date().toISOString();

    return {
      ...templateInput,
      id: createProductTemplateId(crypto.randomUUID()),
      name: templateInput.name?.trim(),
      i18nKey: undefined, // Custom templates don't use i18nKey
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Creates a built-in product template (for internal use only).
   * Built-in templates are predefined and should not be created dynamically.
   *
   * @param input - Template data with i18nKey
   * @param id - Predefined ID (kebab-case string, not UUID)
   * @returns ProductTemplate
   * @throws ProductTemplateValidationError if validation fails
   */
  static createBuiltIn(
    input: CreateProductTemplateInput,
    id: string,
  ): ProductTemplate {
    // Ensure isBuiltIn is true and isCustom is false
    const templateInput: CreateProductTemplateInput = {
      ...input,
      isBuiltIn: true,
      isCustom: false,
    };

    validateTemplateInput(templateInput);

    return {
      ...templateInput,
      id: createProductTemplateId(id),
      name: undefined, // Built-in templates don't use name
      i18nKey: templateInput.i18nKey?.trim(),
      createdAt: undefined, // Built-in templates don't have timestamps
      updatedAt: undefined,
    };
  }
}
