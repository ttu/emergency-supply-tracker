// Branded types - import first so they can be used in interfaces below
import type {
  ItemId,
  CategoryId,
  ProductTemplateId,
  AlertId,
  DateOnly,
  Quantity,
  Percentage,
  InventorySetId,
} from './branded';
export type {
  ItemId,
  CategoryId,
  ProductTemplateId,
  AlertId,
  DateOnly,
  Quantity,
  Percentage,
  InventorySetId,
} from './branded';
export {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  createDateOnly,
  createQuantity,
  createPercentage,
  createInventorySetId,
  isItemId,
  isCategoryId,
  isDateOnly,
  isQuantity,
  isPercentage,
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
  'pets',
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
  pets: number;
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

/** Themes available for user selection (excludes 'auto') */
export const SELECTABLE_THEMES = [
  'light',
  'dark',
  'midnight',
  'ocean',
  'sunset',
  'forest',
  'lavender',
  'minimal',
] as const satisfies readonly Theme[];

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
  childrenRequirementPercentage?: Percentage; // Default: 75 (children need 75% of adult requirements)
}

// Category
export interface Category {
  id: CategoryId;
  name: string;
  names?: LocalizedNames; // Localized names for custom categories
  icon?: string;
  isCustom: boolean;
  description?: string; // Current language description
  descriptions?: LocalizedNames; // Localized descriptions
  sortOrder?: number; // Position in category lists
  color?: string; // Hex color for category accent
  sourceKitId?: KitId; // Which kit imported this category
}

/**
 * Category definition in imported kit files.
 * Used for custom categories defined in recommendation kits.
 */
export interface ImportedCategory {
  id: string;
  names: LocalizedNames;
  icon: string;
  description?: LocalizedNames;
  sortOrder?: number;
  color?: string;
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
  quantity: Quantity;
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
  names?: LocalizedNames; // Localized names for custom templates: { en: "Water", fi: "Vesi" }
  i18nKey?: string;
  kind?: ProductKind;
  category: StandardCategoryId | string;
  defaultUnit?: Unit;
  /** If true, items created from this template default to no expiration */
  neverExpires?: boolean;
  /** Default expiration in months when neverExpires is false (optional) */
  defaultExpirationMonths?: number;
  /** Weight per unit in grams (e.g. for food) */
  weightGrams?: number;
  /** Calories per unit (e.g. for food) */
  caloriesPerUnit?: number;
  /** Calories per 100g for calorie calculation from weight */
  caloriesPer100g?: number;
  /** Liters of water required per unit for preparation (food) */
  requiresWaterLiters?: number;
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
  category: StandardCategoryId | string; // Standard category ID or custom category ID
  baseQuantity: Quantity;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  /** @categorySpecific Pets category only - Scale quantity with number of pets */
  scaleWithPets?: boolean;
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
  category: StandardCategoryId | string; // Standard category ID or custom category ID
  baseQuantity: Quantity;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  /** @categorySpecific Pets category only - Scale quantity with number of pets */
  scaleWithPets?: boolean;
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

/** Kit meta name or description: single string (legacy) or localized by language code (en required as fallback) */
export type LocalizedMetaString = string | LocalizedNames;

// Recommended Items File Metadata
export interface RecommendedItemsFileMeta {
  /** Kit name; use LocalizedNames (e.g. { en: "...", fi: "..." }) for shared/uploaded kits so names work in all languages. English (en) is used when the selected language is missing. */
  name: LocalizedMetaString;
  version: string; // e.g., "1.0.0"
  /** Optional description; same localization as name. */
  description?: LocalizedMetaString;
  source?: string; // e.g., "72tuntia.fi", URL
  createdAt: string; // ISO timestamp
  language?: 'en' | 'fi'; // Primary language of inline names
  forkedFrom?: string; // Built-in kit ID this was forked from (for display purposes)
}

// Recommended Items File (for import/export)
export interface RecommendedItemsFile {
  meta: RecommendedItemsFileMeta;
  categories?: ImportedCategory[]; // Custom category definitions
  items: ImportedRecommendedItem[];
}

// Recommendation Kit Types

/** Built-in kit identifiers */
export const BUILT_IN_KIT_IDS = [
  '72tuntia-standard',
  'minimal-essentials',
  'none',
] as const;

export type BuiltInKitId = (typeof BUILT_IN_KIT_IDS)[number];

/** Kit identifier: either a built-in kit or a custom uploaded kit */
export type KitId = BuiltInKitId | `custom:${string}`;

/** Helper to check if a kit ID is a built-in kit */
export function isBuiltInKitId(kitId: string): kitId is BuiltInKitId {
  return BUILT_IN_KIT_IDS.includes(kitId as BuiltInKitId);
}

/** Helper to check if a kit ID is a custom kit */
export function isCustomKitId(kitId: string): kitId is `custom:${string}` {
  return kitId.startsWith('custom:');
}

/** Extract the UUID from a custom kit ID */
export function getCustomKitUuid(kitId: `custom:${string}`): string {
  return kitId.replace('custom:', '');
}

/** Create a custom kit ID from a UUID */
export function createCustomKitId(uuid: string): `custom:${string}` {
  return `custom:${uuid}`;
}

/** A user-uploaded custom recommendation kit stored in localStorage */
export interface UploadedKit {
  id: string; // UUID
  file: RecommendedItemsFile;
  uploadedAt: string; // ISO timestamp
}

/** Summary info about an available kit (for display in UI) */
export interface KitInfo {
  id: KitId;
  name: string;
  description?: string;
  itemCount: number;
  isBuiltIn: boolean;
  uploadedAt?: string; // Only for custom kits
}

/** Per-inventory-set data (one inventory context, e.g. home or car kit) */
export interface InventorySetData {
  id: InventorySetId;
  name: string;
  household: HouseholdConfig;
  items: InventoryItem[];
  customCategories: Category[];
  customTemplates: ProductTemplate[];
  dismissedAlertIds: AlertId[];
  disabledRecommendedItems: ProductTemplateId[];
  disabledCategories: StandardCategoryId[];
  selectedRecommendationKit?: KitId;
  uploadedRecommendationKits?: UploadedKit[];
  customRecommendedItems?: RecommendedItemsFile | null;
  lastModified: string;
  lastBackupDate?: DateOnly;
  backupReminderDismissedUntil?: DateOnly;
}

/** Root storage shape: global settings + inventory sets keyed by id */
export interface RootStorage {
  version: string;
  settings: UserSettings;
  activeInventorySetId: InventorySetId;
  inventorySets: Record<string, InventorySetData>;
}

// App Data (root) - effective view: merged settings + active inventory set (consumers unchanged)
export interface AppData {
  version: string;
  household: HouseholdConfig;
  settings: UserSettings;
  customCategories: Category[]; // Only user's custom categories, STANDARD_CATEGORIES are always available
  items: InventoryItem[];
  customTemplates: ProductTemplate[];
  dismissedAlertIds: AlertId[]; // Alert IDs that have been dismissed by the user
  disabledRecommendedItems: ProductTemplateId[]; // Product template IDs that have been disabled by the user
  disabledCategories: StandardCategoryId[]; // Category IDs that have been disabled by the user
  // Kit management (new multi-kit system)
  selectedRecommendationKit?: KitId; // Currently selected kit ID
  uploadedRecommendationKits?: UploadedKit[]; // User-uploaded custom kits
  // Legacy field - kept for migration, will be migrated to uploadedRecommendationKits
  customRecommendedItems?: RecommendedItemsFile | null; // @deprecated - use uploadedRecommendationKits
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
