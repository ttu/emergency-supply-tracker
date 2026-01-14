import type { Category, StandardCategoryId } from '@/shared/types';
import { createCategoryId, VALID_CATEGORIES } from '@/shared/types';

/**
 * Input for creating a custom category.
 * Omits fields that are auto-generated: id
 */
export type CreateCategoryInput = Omit<Category, 'id'>;

/**
 * Input for creating a standard category (for internal use).
 */
export interface CreateStandardCategoryInput {
  id: StandardCategoryId;
  name: string;
  icon?: string;
}

/**
 * Validation error thrown when category creation fails validation.
 */
export class CategoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryValidationError';
  }
}

/**
 * Validates that an icon is a valid emoji (basic check).
 * Checks if the string contains emoji characters.
 */
function isValidEmoji(icon: string): boolean {
  // Basic emoji validation - check for emoji Unicode ranges
  // This is a simplified check; full emoji validation is complex
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;
  return emojiRegex.test(icon);
}

/**
 * Validates category input.
 */
function validateCategoryInput(
  input: CreateCategoryInput,
  existingCategories: Category[] = [],
): void {
  // Required fields
  if (!input.name?.trim()) {
    throw new CategoryValidationError('name is required and cannot be empty');
  }

  // isCustom must be true for user-created categories
  if (!input.isCustom) {
    throw new CategoryValidationError(
      'isCustom must be true for user-created categories',
    );
  }

  // Validate icon if provided
  if (input.icon && !isValidEmoji(input.icon)) {
    throw new CategoryValidationError(
      `Invalid icon: ${input.icon}. Icon must be a valid emoji.`,
    );
  }

  // Check for duplicate names (case-insensitive)
  const trimmedName = input.name.trim().toLowerCase();
  const duplicate = existingCategories.find(
    (cat) => cat.name.toLowerCase() === trimmedName && cat.isCustom,
  );
  if (duplicate) {
    throw new CategoryValidationError(
      `Category with name "${input.name}" already exists`,
    );
  }
}

/**
 * Factory for creating Category instances with validation.
 */
export class CategoryFactory {
  /**
   * Creates a custom category from input data.
   * Validates all inputs and generates id automatically.
   *
   * @param input - Category data (without id)
   * @param existingCategories - Existing categories to check for duplicates (optional)
   * @returns Validated Category
   * @throws CategoryValidationError if validation fails
   */
  static createCustom(
    input: CreateCategoryInput,
    existingCategories: Category[] = [],
  ): Category {
    validateCategoryInput(input, existingCategories);

    return {
      ...input,
      id: createCategoryId(crypto.randomUUID()),
      name: input.name.trim(),
      isCustom: true,
    };
  }

  /**
   * Creates a standard category (for internal use only).
   * Standard categories are predefined and should not be created dynamically.
   *
   * @param input - Standard category data
   * @returns Category
   * @throws CategoryValidationError if id is not a valid StandardCategoryId
   */
  static createStandard(input: CreateStandardCategoryInput): Category {
    // Validate id is a valid StandardCategoryId
    if (!VALID_CATEGORIES.includes(input.id)) {
      throw new CategoryValidationError(`Invalid category id: ${input.id}`);
    }

    return {
      id: createCategoryId(input.id),
      name: input.name,
      icon: input.icon,
      isCustom: false,
    };
  }
}
