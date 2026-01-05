// Branded types - import first so they can be used in interfaces below
import type {
  ItemId,
  CategoryId,
  TemplateId,
  AlertId,
  RecommendedItemId,
} from './branded';
export type {
  ItemId,
  CategoryId,
  TemplateId,
  AlertId,
  RecommendedItemId,
} from './branded';
export {
  createItemId,
  createCategoryId,
  createTemplateId,
  createAlertId,
  createRecommendedItemId,
  isItemId,
  isCategoryId,
} from './branded';

// Core types
export type Unit =
  | 'pieces'
  | 'liters'
  | 'kilograms'
  | 'grams'
  | 'cans'
  | 'bottles'
  | 'packages'
  | 'jars'
  | 'canisters'
  | 'boxes'
  | 'days'
  | 'rolls'
  | 'tubes'
  | 'meters'
  | 'pairs'
  | 'euros'
  | 'sets';
export type ItemStatus = 'ok' | 'warning' | 'critical';
export type StandardCategoryId =
  | 'water-beverages'
  | 'food'
  | 'cooking-heat'
  | 'light-power'
  | 'communication-info'
  | 'medical-health'
  | 'hygiene-sanitation'
  | 'tools-supplies'
  | 'cash-documents';
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
export interface UserSettings {
  language: 'en' | 'fi';
  theme:
    | 'light'
    | 'dark'
    | 'auto'
    | 'midnight'
    | 'ocean'
    | 'sunset'
    | 'forest'
    | 'lavender'
    | 'minimal';
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
  standardCategoryId?: StandardCategoryId;
  name: string;
  icon?: string;
  isCustom: boolean;
}

// Inventory Item
export interface InventoryItem {
  id: ItemId;
  name: string;
  itemType: string; // Template ID (e.g., "canned-fish") or "custom" for user-created items, used for i18n lookup
  categoryId: CategoryId;
  quantity: number;
  unit: Unit;
  recommendedQuantity: number;
  expirationDate?: string;
  neverExpires?: boolean;
  location?: string;
  notes?: string;
  productTemplateId?: TemplateId;
  weightGrams?: number; // Weight per unit in grams (e.g., one can weighs 400g)
  caloriesPerUnit?: number; // Calories per unit (e.g., one can has 200 kcal)
  capacityMah?: number; // Capacity in milliamp-hours (for powerbanks)
  capacityWh?: number; // Capacity in watt-hours (for powerbanks)
  requiresWaterLiters?: number; // Liters of water required per unit for preparation
  markedAsEnough?: boolean; // If true, item is considered complete regardless of quantity vs recommendedQuantity
  createdAt: string;
  updatedAt: string;
}

// Product Template
export interface ProductTemplate {
  id: TemplateId;
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

// Recommended Item Definition
export interface RecommendedItemDefinition {
  id: RecommendedItemId;
  i18nKey: string;
  category: StandardCategoryId;
  baseQuantity: number;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  requiresFreezer?: boolean;
  defaultExpirationMonths?: number;
  // Weight and calorie tracking for food items
  weightGramsPerUnit?: number; // Weight in grams per unit (e.g., 150g per can)
  caloriesPer100g?: number; // Calories per 100g of weight
  caloriesPerUnit?: number; // Calories per unit (calculated or direct value)
  // Capacity for powerbanks
  capacityMah?: number; // Capacity in milliamp-hours
  capacityWh?: number; // Capacity in watt-hours
  // Water requirement for preparation
  requiresWaterLiters?: number; // Liters of water required per unit for preparation (must be > 0 if set)
}

// Localized names object for imported items (keyed by language code)
export type LocalizedNames = Record<string, string>; // e.g., { en: "Water", fi: "Vesi", sv: "Vatten" }

// Imported Recommended Item (supports inline translations for custom items)
export interface ImportedRecommendedItem {
  id: RecommendedItemId;
  i18nKey?: string; // Use built-in translation key (e.g., "products.bottled-water")
  names?: LocalizedNames; // OR inline localized names: { en: "Water", fi: "Vesi" }
  category: StandardCategoryId;
  baseQuantity: number;
  unit: Unit;
  scaleWithPeople: boolean;
  scaleWithDays: boolean;
  requiresFreezer?: boolean;
  defaultExpirationMonths?: number;
  weightGramsPerUnit?: number;
  caloriesPer100g?: number;
  caloriesPerUnit?: number;
  capacityMah?: number;
  capacityWh?: number;
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
  disabledRecommendedItems: RecommendedItemId[]; // Recommended item IDs that have been disabled by the user
  customRecommendedItems?: RecommendedItemsFile | null; // Custom imported recommendations (null = use built-in)
  lastModified: string;
  lastBackupDate?: string; // ISO date of last export
  backupReminderDismissedUntil?: string; // ISO date (first of next month) - reminder hidden until this date
}
