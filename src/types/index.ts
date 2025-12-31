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
  theme: 'light' | 'dark' | 'auto';
  highContrast: boolean;
  advancedFeatures: {
    calorieTracking: boolean;
    powerManagement: boolean;
    waterTracking: boolean;
  };
  onboardingCompleted?: boolean;
}

// Category
export interface Category {
  id: string;
  standardCategoryId?: StandardCategoryId;
  name: string;
  icon?: string;
  isCustom: boolean;
}

// Inventory Item
export interface InventoryItem {
  id: string;
  name: string;
  itemType?: string; // Template ID (e.g., "canned-fish"), used for i18n lookup, read-only from template
  categoryId: string;
  quantity: number;
  unit: Unit;
  recommendedQuantity: number;
  expirationDate?: string;
  neverExpires?: boolean;
  location?: string;
  notes?: string;
  productTemplateId?: string;
  weightGrams?: number; // Weight per unit in grams (e.g., one can weighs 400g)
  caloriesPerUnit?: number; // Calories per unit (e.g., one can has 200 kcal)
  capacityMah?: number; // Capacity in milliamp-hours (for powerbanks)
  capacityWh?: number; // Capacity in watt-hours (for powerbanks)
  requiresWaterLiters?: number; // Liters of water required per unit for preparation
  createdAt: string;
  updatedAt: string;
}

// Product Template
export interface ProductTemplate {
  id: string;
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
  id: string;
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

// App Data (root)
export interface AppData {
  version: string;
  household: HouseholdConfig;
  settings: UserSettings;
  customCategories: Category[]; // Only user's custom categories, STANDARD_CATEGORIES are always available
  items: InventoryItem[];
  customTemplates: ProductTemplate[];
  dismissedAlertIds: string[]; // Alert IDs that have been dismissed by the user
  disabledRecommendedItems: string[]; // Recommended item IDs that have been disabled by the user
  lastModified: string;
  lastBackupDate?: string; // ISO date of last export
  backupReminderDismissedUntil?: string; // ISO date (first of next month) - reminder hidden until this date
}
