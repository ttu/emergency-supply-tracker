import type {
  ProductTemplate,
  StandardCategoryId,
  ProductKind,
} from '@/shared/types';
import { createProductTemplateId } from '@/shared/types';
import { isValidUnit } from '@/shared/utils/validation/unitValidation';

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
 * Validates that a category is a valid StandardCategoryId or non-empty string.
 */
function isValidCategory(category: string | undefined): boolean {
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
 * Validates name/i18nKey requirements.
 */
function validateNameOrI18nKey(hasName: boolean, hasI18nKey: boolean): void {
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
}

/**
 * Validates template flags and their consistency with name/i18nKey.
 */
function validateTemplateFlags(
  hasName: boolean,
  hasI18nKey: boolean,
  isBuiltIn: boolean | undefined,
  isCustom: boolean | undefined,
): void {
  if (isBuiltIn && isCustom) {
    throw new ProductTemplateValidationError(
      'Template cannot be both built-in and custom',
    );
  }

  if (isCustom && !hasName) {
    throw new ProductTemplateValidationError(
      'Custom templates must have a name (not i18nKey)',
    );
  }

  if (isBuiltIn && !hasI18nKey) {
    throw new ProductTemplateValidationError(
      'Built-in templates should have i18nKey (not name)',
    );
  }
}

/**
 * Validates template input.
 */
function validateTemplateInput(input: CreateProductTemplateInput): void {
  // Validate name OR i18nKey (mutually exclusive)
  const hasName = Boolean(input.name?.trim());
  const hasI18nKey = Boolean(input.i18nKey?.trim());

  validateNameOrI18nKey(hasName, hasI18nKey);

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

  // Validate flags
  validateTemplateFlags(hasName, hasI18nKey, input.isBuiltIn, input.isCustom);
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
