// Branded types - import first so they can be used in interfaces below
import type {
  ItemId,
  CategoryId,
  ProductTemplateId,
  AlertId,
  DateOnly,
} from './branded';
export type {
  ItemId,
  CategoryId,
  ProductTemplateId,
  AlertId,
  DateOnly,
} from './branded';
export {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  createDateOnly,
  isItemId,
  isCategoryId,
  isDateOnly,
} from './branded';

// Core types
export const VALID_UNITS = [
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
] as const;

export type Unit = (typeof VALID_UNITS)[number];

export type ItemStatus = 'ok' | 'warning' | 'critical';

export const VALID_CATEGORIES = [
  'water-beverages',
  'food',
  'cooking-heat',
  'light-power',
  'communication-info',
  'medical-health',
  'hygiene-sanitation',
  'tools-supplies',
  'cash-documents',
] as const;

export type StandardCategoryId = (typeof VALID_CATEGORIES)[number];
export type ProductKind =
  | 'food'
  | 'water'
  | 'medicine'
  | 'energy'
  | 'hygiene'
  | 'device'
  | 'other';
export type BatteryType = 'AAA' | 'AA' | 'C' | 'D' | '9V' | 'CR2032';

// Household Configuration
export interface HouseholdConfig {
  adults: number;
  children: number;
  supplyDurationDays: number;
  useFreezer: boolean;
  freezerHoldTimeHours?: number;
}

// User Settings
export const VALID_THEMES = [
  'light',
  'dark',
  'auto',
  'midnight',
  'ocean',
  'sunset',
  'forest',
  'lavender',
  'minimal',
] as const;

export type Theme = (typeof VALID_THEMES)[number];

export interface UserSettings {
  language: 'en' | 'fi';
  theme: Theme;
  highContrast: boolean;
  advancedFeatures: {
    calorieTracking: boolean;
    powerManagement: boolean;
    waterTracking: boolean;
  };
  onboardingCompleted?: boolean;
  // Customizable nutrition and requirement settings
  dailyCaloriesPerPerson?: number; // Default: 2000 kcal
  dailyWaterPerPerson?: number; // Default: 3 liters
  childrenRequirementPercentage?: number; // Default: 75 (children need 75% of adult requirements)
}

// Category
export interface Category {
  id: CategoryId;
  name: string;
  icon?: string;
  isCustom: boolean;
}

/**
 * Inventory Item
 *
 * Represents a single item in the user's emergency supply inventory.
 * Some properties are category-specific and should only be used for certain item types.
 */
export interface InventoryItem {
  id: ItemId;
  name: string;
  itemType: ProductTemplateId | 'custom'; // Template ID (e.g., "canned-fish") or "custom" for user-created items, used for i18n lookup
  categoryId: CategoryId;
  quantity: number;
  unit: Unit;
  expirationDate?: DateOnly;
  purchaseDate?: DateOnly;
  neverExpires?: boolean;
  location?: string;
  notes?: string;
  /** @categorySpecific Food category only - Weight per unit in grams (e.g., one can weighs 400g) */
  weightGrams?: number;
  /** @categorySpecific Food category only - Calories per unit (e.g., one can has 200 kcal) */
  caloriesPerUnit?: number;
  /** @categorySpecific Light-power category only - Capacity in milliamp-hours (for powerbanks) */
  capacityMah?: number;
  /** @categorySpecific Light-power category only - Capacity in watt-hours (for powerbanks) */
  capacityWh?: number;
  /** @categorySpecific Food category only - Liters of water required per unit for preparation */
  requiresWaterLiters?: number;
  markedAsEnough?: boolean; // If true, item is considered complete regardless of quantity vs recommended quantity
  createdAt: string;
  updatedAt: string;
}

// Product Template
export interface ProductTemplate {
  id: ProductTemplateId;
  name?: string;
  i18nKey?: string;
  kind?: ProductKind;
  category: StandardCategoryId | string;
  defaultUnit?: Unit;
  isBuiltIn: boolean;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Recommended Item Definition
 *
 * Represents a recommended emergency supply item based on 72tuntia.fi guidelines.
 * Some properties are category-specific and should only be used for certain item types.
 */
export interface RecommendedItemDefinition {
  id: ProductTemplateId; // Recommended items are product templates
  i18nKey: string;
  category: StandardCategoryId;
  baseQuantity: number;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  requiresFreezer?: boolean;
  defaultExpirationMonths?: number;
  /** @categorySpecific Food category only - Weight in grams per unit (e.g., 150g per can) */
  weightGramsPerUnit?: number;
  /** @categorySpecific Food category only - Calories per 100g of weight */
  caloriesPer100g?: number;
  /** @categorySpecific Food category only - Calories per unit (calculated or direct value) */
  caloriesPerUnit?: number;
  /** @categorySpecific Light-power category only - Capacity in milliamp-hours */
  capacityMah?: number;
  /** @categorySpecific Light-power category only - Capacity in watt-hours */
  capacityWh?: number;
  /** @categorySpecific Food category only - Liters of water required per unit for preparation (must be > 0 if set) */
  requiresWaterLiters?: number;
}

// Localized names object for imported items (keyed by language code)
export type LocalizedNames = Record<string, string>; // e.g., { en: "Water", fi: "Vesi", sv: "Vatten" }

/**
 * Imported Recommended Item (supports inline translations for custom items)
 *
 * Represents a recommended item imported from a custom recommendations file.
 * Some properties are category-specific and should only be used for certain item types.
 */
export interface ImportedRecommendedItem {
  id: ProductTemplateId;
  i18nKey?: string; // Use built-in translation key (e.g., "products.bottled-water")
  names?: LocalizedNames; // OR inline localized names: { en: "Water", fi: "Vesi" }
  category: StandardCategoryId;
  baseQuantity: number;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  requiresFreezer?: boolean;
  defaultExpirationMonths?: number;
  /** @categorySpecific Food category only - Weight in grams per unit (e.g., 150g per can) */
  weightGramsPerUnit?: number;
  /** @categorySpecific Food category only - Calories per 100g of weight */
  caloriesPer100g?: number;
  /** @categorySpecific Food category only - Calories per unit (calculated or direct value) */
  caloriesPerUnit?: number;
  /** @categorySpecific Light-power category only - Capacity in milliamp-hours */
  capacityMah?: number;
  /** @categorySpecific Light-power category only - Capacity in watt-hours */
  capacityWh?: number;
  /** @categorySpecific Food category only - Liters of water required per unit for preparation (must be > 0 if set) */
  requiresWaterLiters?: number;
}

// Recommended Items File Metadata
export interface RecommendedItemsFileMeta {
  name: string; // e.g., "Finnish Family Kit"
  version: string; // e.g., "1.0.0"
  description?: string;
  source?: string; // e.g., "72tuntia.fi", URL
  createdAt: string; // ISO timestamp
  language?: 'en' | 'fi'; // Primary language of inline names
}

// Recommended Items File (for import/export)
export interface RecommendedItemsFile {
  meta: RecommendedItemsFileMeta;
  items: ImportedRecommendedItem[];
}

// App Data (root)
export interface AppData {
  version: string;
  household: HouseholdConfig;
  settings: UserSettings;
  customCategories: Category[]; // Only user's custom categories, STANDARD_CATEGORIES are always available
  items: InventoryItem[];
  customTemplates: ProductTemplate[];
  dismissedAlertIds: AlertId[]; // Alert IDs that have been dismissed by the user
  disabledRecommendedItems: ProductTemplateId[]; // Product template IDs that have been disabled by the user
  customRecommendedItems?: RecommendedItemsFile | null; // Custom imported recommendations (null = use built-in)
  lastModified: string;
  lastBackupDate?: DateOnly; // ISO date of last export
  backupReminderDismissedUntil?: DateOnly; // ISO date (first of next month) - reminder hidden until this date
}

// Type guards for category-specific inventory items

/**
 * Type guard to check if an inventory item belongs to the food category.
 * Food items may have weightGrams, caloriesPerUnit, and requiresWaterLiters properties.
 *
 * @param item - The inventory item to check
 * @returns True if the item belongs to the food category
 *
 * @example
 * ```typescript
 * if (isFoodItem(item)) {
 *   // TypeScript now knows item may have weightGrams, caloriesPerUnit, etc.
 *   const calories = item.caloriesPerUnit ?? 0;
 * }
 * ```
 */
export function isFoodItem(item: InventoryItem): boolean {
  return item.categoryId === 'food';
}

/**
 * Type guard to check if an inventory item belongs to the light-power category.
 * Power items may have capacityMah and capacityWh properties.
 *
 * @param item - The inventory item to check
 * @returns True if the item belongs to the light-power category
 *
 * @example
 * ```typescript
 * if (isPowerItem(item)) {
 *   // TypeScript now knows item may have capacityMah, capacityWh
 *   const capacity = item.capacityWh ?? 0;
 * }
 * ```
 */
export function isPowerItem(item: InventoryItem): boolean {
  return item.categoryId === 'light-power';
}

/**
 * Helper function to check if a category ID string represents the food category.
 * Useful when working with categoryId strings directly (e.g., in forms or calculations).
 *
 * @param categoryId - The category ID string to check
 * @returns True if the category ID is 'food'
 *
 * @example
 * ```typescript
 * if (isFoodCategory(categoryId)) {
 *   // Handle food category logic
 * }
 * ```
 */
export function isFoodCategory(categoryId: string): boolean {
  return categoryId === 'food';
}

/**
 * Helper function to check if a category ID string represents the light-power category.
 * Useful when working with categoryId strings directly (e.g., in forms or calculations).
 *
 * @param categoryId - The category ID string to check
 * @returns True if the category ID is 'light-power'
 *
 * @example
 * ```typescript
 * if (isPowerCategory(categoryId)) {
 *   // Handle power category logic
 * }
 * ```
 */
export function isPowerCategory(categoryId: string): boolean {
  return categoryId === 'light-power';
}

// Type guards for RecommendedItemDefinition

/**
 * Type guard to check if a recommended item belongs to the food category.
 * Food items may have weightGramsPerUnit, caloriesPer100g, caloriesPerUnit, and requiresWaterLiters properties.
 *
 * @param item - The recommended item to check
 * @returns True if the item belongs to the food category
 *
 * @example
 * ```typescript
 * if (isFoodRecommendedItem(item)) {
 *   // TypeScript now knows item may have caloriesPerUnit, weightGramsPerUnit, etc.
 *   const calories = item.caloriesPerUnit ?? 0;
 * }
 * ```
 */
export function isFoodRecommendedItem(
  item: RecommendedItemDefinition,
): boolean {
  return item.category === 'food';
}

/**
 * Type guard to check if a recommended item belongs to the light-power category.
 * Power items may have capacityMah and capacityWh properties.
 *
 * @param item - The recommended item to check
 * @returns True if the item belongs to the light-power category
 *
 * @example
 * ```typescript
 * if (isPowerRecommendedItem(item)) {
 *   // TypeScript now knows item may have capacityMah, capacityWh
 *   const capacity = item.capacityWh ?? 0;
 * }
 * ```
 */
export function isPowerRecommendedItem(
  item: RecommendedItemDefinition,
): boolean {
  return item.category === 'light-power';
}
