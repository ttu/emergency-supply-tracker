/**
 * Application-wide constants for emergency supply tracker.
 * Centralizes magic numbers for maintainability and consistency.
 */

// =============================================================================
// HOUSEHOLD CALCULATION CONSTANTS
// =============================================================================

/**
 * Multiplier for children's requirements compared to adults.
 * Children count as 75% of an adult's needs.
 */
export const CHILDREN_REQUIREMENT_MULTIPLIER = 0.75;

/**
 * Multiplier for adults' requirements (baseline = 1.0).
 */
export const ADULT_REQUIREMENT_MULTIPLIER = 1.0;

/**
 * Multiplier for pets' requirements.
 * Pets count as 1 each for their specific supplies.
 */
export const PET_REQUIREMENT_MULTIPLIER = 1;

/**
 * Daily water requirement per person in liters.
 * Standard emergency preparedness recommendation: 3 liters per person per day.
 */
export const DAILY_WATER_PER_PERSON = 3;

// =============================================================================
// CALORIE CONSTANTS
// =============================================================================

/**
 * Daily calorie requirement per person for emergency situations.
 */
export const DAILY_CALORIES_PER_PERSON = 2000;

/**
 * Base weight unit for calorie calculations (grams).
 * Calories are typically specified per 100g.
 */
export const CALORIE_BASE_WEIGHT_GRAMS = 100;

/**
 * Default weight per unit (grams) for food items when no template or existing weight is provided.
 */
export const DEFAULT_WEIGHT_PER_UNIT_GRAMS = 100;

/**
 * Threshold in grams for converting to kilograms in display.
 */
export const GRAMS_TO_KG_THRESHOLD = 1000;

/**
 * Threshold in calories for formatting (above this, show in kcal format).
 */
export const CALORIE_DISPLAY_THRESHOLD = 1000;

// =============================================================================
// TIME CONVERSION CONSTANTS
// =============================================================================

/**
 * Milliseconds in one second.
 */
export const MS_PER_SECOND = 1000;

/**
 * Seconds in one minute.
 */
export const SECONDS_PER_MINUTE = 60;

/**
 * Minutes in one hour.
 */
export const MINUTES_PER_HOUR = 60;

/**
 * Hours in one day.
 */
export const HOURS_PER_DAY = 24;

/**
 * Milliseconds in one day.
 */
export const MS_PER_DAY =
  MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

// =============================================================================
// EXPIRATION THRESHOLD CONSTANTS
// =============================================================================

/**
 * Days threshold for showing "expires soon" warning on item cards.
 */
export const EXPIRING_SOON_DAYS_THRESHOLD = 30;

/**
 * Days threshold for generating "expiring soon" alerts.
 */
export const EXPIRING_SOON_ALERT_DAYS = 30;

// =============================================================================
// STATUS THRESHOLD CONSTANTS
// =============================================================================

/**
 * Quantity ratio threshold for warning status.
 * Items below this ratio of recommended quantity show warning.
 */
export const LOW_QUANTITY_WARNING_RATIO = 0.5;

/**
 * Percentage threshold below which category status is critical.
 */
export const CRITICAL_PERCENTAGE_THRESHOLD = 30;

/**
 * Percentage threshold below which category status is warning.
 */
export const WARNING_PERCENTAGE_THRESHOLD = 70;

/**
 * Score threshold at or above which status is "ok".
 */
export const OK_SCORE_THRESHOLD = 80;

/**
 * Score threshold at or above which status is "warning" (below is critical).
 */
export const WARNING_SCORE_THRESHOLD = 50;

// =============================================================================
// ALERT THRESHOLD CONSTANTS
// =============================================================================

/**
 * Percentage threshold below which stock is critically low.
 */
export const CRITICALLY_LOW_STOCK_PERCENTAGE = 25;

/**
 * Percentage threshold below which stock is running low.
 */
export const LOW_STOCK_PERCENTAGE = 50;

// =============================================================================
// PREPAREDNESS SCORE CONSTANTS
// =============================================================================

/**
 * Maximum score for a single item (100%).
 */
export const MAX_ITEM_SCORE = 100;

/**
 * Default preparedness score for categories with items but no recommendations.
 */
export const DEFAULT_FULL_PREPAREDNESS = 100;

/**
 * Default preparedness score for empty categories with no recommendations.
 */
export const DEFAULT_EMPTY_PREPAREDNESS = 0;

// =============================================================================
// BACKUP REMINDER CONSTANTS
// =============================================================================

/**
 * Days threshold for showing backup reminder.
 */
export const BACKUP_REMINDER_DAYS_THRESHOLD = 30;

// =============================================================================
// ITEM TYPE CONSTANTS
// =============================================================================

/**
 * Item type identifier for custom items (not from a template).
 * Used when user creates an item manually without selecting a product template.
 */
export const CUSTOM_ITEM_TYPE = 'custom';
