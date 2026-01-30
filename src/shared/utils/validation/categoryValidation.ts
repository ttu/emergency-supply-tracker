import type { ImportedCategory } from '@/shared/types';
import { VALID_CATEGORIES } from '@/shared/types';
import type {
  ValidationError,
  ValidationWarning,
} from './recommendedItemsValidation';

/**
 * Validates a category ID is kebab-case, 3-50 characters.
 */
export function isValidCategoryId(id: string): boolean {
  if (!id || id.length < 3 || id.length > 50) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
}

/**
 * Validates a hex color string (#RGB or #RRGGBB).
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Validates an emoji icon (basic check).
 * Covers common emoji ranges including symbols, pictographs, and flags.
 */
function isValidEmoji(icon: string): boolean {
  // Match common emoji ranges
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|\u{2B50}/u;
  return emojiRegex.test(icon);
}

export interface CategoryValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validates a single imported category.
 */
export function validateImportedCategory(
  category: unknown,
  index: number,
): CategoryValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const path = `categories[${index}]`;

  if (!category || typeof category !== 'object') {
    errors.push({
      path,
      message: 'Category must be an object',
      code: 'INVALID_CATEGORY',
    });
    return { errors, warnings };
  }

  const c = category as Record<string, unknown>;

  // Required: id (kebab-case, 3-50 chars)
  if (typeof c.id !== 'string' || !isValidCategoryId(c.id)) {
    errors.push({
      path: `${path}.id`,
      message: 'Category ID must be kebab-case, 3-50 characters',
      code: 'INVALID_CATEGORY_ID',
    });
  }

  // Required: names with at least 'en' key
  if (!c.names || typeof c.names !== 'object' || Array.isArray(c.names)) {
    errors.push({
      path: `${path}.names`,
      message: 'Category names must be an object',
      code: 'INVALID_CATEGORY_NAMES',
    });
  } else {
    const names = c.names as Record<string, unknown>;
    if (typeof names.en !== 'string' || names.en.trim() === '') {
      errors.push({
        path: `${path}.names.en`,
        message: 'Category must have names.en (English name)',
        code: 'MISSING_CATEGORY_NAME',
      });
    }
  }

  // Required: icon (emoji)
  if (typeof c.icon !== 'string' || !isValidEmoji(c.icon)) {
    errors.push({
      path: `${path}.icon`,
      message: 'Category icon must be a valid emoji',
      code: 'INVALID_CATEGORY_ICON',
    });
  }

  // Optional: color (hex format)
  if (c.color !== undefined) {
    if (typeof c.color !== 'string' || !isValidHexColor(c.color)) {
      errors.push({
        path: `${path}.color`,
        message: 'Category color must be valid hex format (#RGB or #RRGGBB)',
        code: 'INVALID_CATEGORY_COLOR',
      });
    }
  }

  // Optional: sortOrder (non-negative integer)
  if (c.sortOrder !== undefined) {
    if (
      typeof c.sortOrder !== 'number' ||
      !Number.isInteger(c.sortOrder) ||
      c.sortOrder < 0
    ) {
      warnings.push({
        path: `${path}.sortOrder`,
        message: 'sortOrder should be a non-negative integer',
        code: 'INVALID_SORT_ORDER',
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validates an array of imported categories.
 * Checks for duplicates and conflicts with standard categories.
 */
export function validateImportedCategories(
  categories: unknown[],
): CategoryValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const seenIds = new Set<string>();

  categories.forEach((category, index) => {
    const result = validateImportedCategory(category, index);
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    // Check for duplicate IDs and conflicts with standard categories
    if (category && typeof category === 'object') {
      const c = category as Record<string, unknown>;
      if (typeof c.id === 'string') {
        if (seenIds.has(c.id)) {
          errors.push({
            path: `categories[${index}].id`,
            message: `Duplicate category ID: ${c.id}`,
            code: 'DUPLICATE_CATEGORY_ID',
          });
        } else {
          seenIds.add(c.id);
        }

        // Check for conflict with standard categories
        if ((VALID_CATEGORIES as readonly string[]).includes(c.id)) {
          errors.push({
            path: `categories[${index}].id`,
            message: `Category ID '${c.id}' conflicts with standard category`,
            code: 'CATEGORY_CONFLICTS_STANDARD',
          });
        }
      }
    }
  });

  return { errors, warnings };
}

/**
 * Gets the set of valid category IDs from a kit file.
 * Includes both standard categories and custom categories defined in the file.
 */
export function getValidCategoryIds(
  customCategories: ImportedCategory[] | undefined,
): Set<string> {
  const validIds = new Set<string>(VALID_CATEGORIES);
  if (customCategories) {
    customCategories.forEach((cat) => validIds.add(cat.id));
  }
  return validIds;
}
