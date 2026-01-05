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
 * Branded type for template/product template IDs
 */
export type TemplateId = string & { readonly __brand: 'TemplateId' };

/**
 * Branded type for alert IDs
 */
export type AlertId = string & { readonly __brand: 'AlertId' };

/**
 * Branded type for recommended item IDs
 */
export type RecommendedItemId = string & {
  readonly __brand: 'RecommendedItemId';
};

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
 * Creates a TemplateId from a string
 */
export function createTemplateId(id: string): TemplateId {
  return id as TemplateId;
}

/**
 * Creates an AlertId from a string
 */
export function createAlertId(id: string): AlertId {
  return id as AlertId;
}

/**
 * Creates a RecommendedItemId from a string
 */
export function createRecommendedItemId(id: string): RecommendedItemId {
  return id as RecommendedItemId;
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
