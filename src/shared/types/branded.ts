/**
 * Branded types for domain concepts
 *
 * Branded types add nominal typing to structural types, preventing
 * accidental mixing of similar types (e.g., ItemId and CategoryId).
 *
 * @example
 * ```typescript
 * const itemId = createItemId('123');
 * const categoryId = createCategoryId('456');
 * // itemId = categoryId; // ❌ Type error!
 * ```
 */

/**
 * Branded type for inventory item IDs
 */
export type ItemId = string & { readonly __brand: 'ItemId' };

/**
 * Branded type for category IDs
 */
export type CategoryId = string & { readonly __brand: 'CategoryId' };

/**
 * Branded type for product template IDs.
 *
 * Product templates are used to create inventory items. This includes:
 * - Recommended items (built-in product templates from 72tuntia.fi)
 * - Custom user-created product templates (future)
 */
export type ProductTemplateId = string & {
  readonly __brand: 'ProductTemplateId';
};

/**
 * Branded type for alert IDs
 */
export type AlertId = string & { readonly __brand: 'AlertId' };

/**
 * Branded type for date-only strings (YYYY-MM-DD format).
 *
 * Used for expiration dates, backup dates, and other date-only fields
 * where time information is not needed. This ensures type safety and
 * prevents mixing date-only strings with other string types.
 *
 * @example
 * ```typescript
 * const expirationDate = createDateOnly('2025-03-20');
 * // expirationDate is DateOnly, not just string
 * ```
 */
export type DateOnly = string & { readonly __brand: 'DateOnly' };

/**
 * Creates an ItemId from a string
 */
export function createItemId(id: string): ItemId {
  return id as ItemId;
}

/**
 * Creates a CategoryId from a string
 */
export function createCategoryId(id: string): CategoryId {
  return id as CategoryId;
}

/**
 * Creates a ProductTemplateId from a string
 */
export function createProductTemplateId(id: string): ProductTemplateId {
  return id as ProductTemplateId;
}

/**
 * Creates an AlertId from a string
 */
export function createAlertId(id: string): AlertId {
  return id as AlertId;
}

/**
 * Creates a DateOnly from a string, validating the format (YYYY-MM-DD).
 *
 * @param dateString - String in YYYY-MM-DD format
 * @returns DateOnly branded type
 * @throws Error if the string is not in YYYY-MM-DD format
 */
export function createDateOnly(dateString: string): DateOnly {
  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new Error(
      `Invalid date format: "${dateString}". Expected YYYY-MM-DD format.`,
    );
  }

  // Validate that it's a valid date
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date: "${dateString}". Date does not exist.`);
  }

  return dateString as DateOnly;
}

/**
 * Type guard to check if a string is a valid ItemId
 */
export function isItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a string is a valid CategoryId
 */
export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a string is a valid DateOnly (YYYY-MM-DD format).
 */
export function isDateOnly(value: unknown): value is DateOnly {
  if (typeof value !== 'string') {
    return false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return false;
  }

  // Validate that it's a valid date
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Branded type for non-negative quantity values.
 *
 * Used for inventory item quantities, recommended quantities, and other
 * count-based fields where negative values are invalid.
 *
 * @example
 * ```typescript
 * const qty = createQuantity(5);
 * // qty is Quantity, not just number
 * ```
 */
export type Quantity = number & { readonly __brand: 'Quantity' };

/**
 * Branded type for percentage values (0-100 inclusive).
 *
 * Used for fields like childrenRequirementPercentage where values
 * must be within a valid percentage range.
 *
 * @example
 * ```typescript
 * const pct = createPercentage(75);
 * // pct is Percentage, not just number
 * ```
 */
export type Percentage = number & { readonly __brand: 'Percentage' };

/**
 * Creates a Quantity from a number, validating it is a finite non-negative number.
 *
 * @param value - A finite non-negative number
 * @returns Quantity branded type
 * @throws Error if the value is negative, NaN, or Infinity
 */
export function createQuantity(value: number): Quantity {
  if (Number.isNaN(value)) {
    throw new TypeError(
      `Invalid quantity: ${value}. Quantity must be a valid number.`,
    );
  }
  if (!Number.isFinite(value)) {
    throw new TypeError(
      `Invalid quantity: ${value}. Quantity must be a finite number.`,
    );
  }
  if (value < 0) {
    throw new TypeError(
      `Invalid quantity: ${value}. Quantity must be non-negative.`,
    );
  }
  return value as Quantity;
}

/**
 * Creates a Percentage from a number, validating it is between 0 and 100.
 *
 * @param value - A number between 0 and 100 (inclusive)
 * @returns Percentage branded type
 * @throws Error if the value is outside the valid range or NaN
 */
export function createPercentage(value: number): Percentage {
  if (Number.isNaN(value)) {
    throw new TypeError(
      `Invalid percentage: ${value}. Percentage must be a valid number.`,
    );
  }
  if (value < 0 || value > 100) {
    throw new TypeError(
      `Invalid percentage: ${value}. Percentage must be between 0 and 100.`,
    );
  }
  return value as Percentage;
}

/**
 * Type guard to check if a value is a valid Quantity (finite non-negative number).
 */
export function isQuantity(value: unknown): value is Quantity {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Type guard to check if a value is a valid Percentage (0-100 inclusive).
 */
export function isPercentage(value: unknown): value is Percentage {
  return (
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}
