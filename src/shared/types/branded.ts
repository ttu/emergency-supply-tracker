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
