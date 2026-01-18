import { faker } from '@faker-js/faker';

/**
 * Common Faker configurations for test data generation
 * Reduces duplication across test files
 */

// =============================================================================
// HOUSEHOLD CONFIGURATION RANGES
// =============================================================================

export const FAKER_ADULTS = { min: 1, max: 5 } as const;
export const FAKER_CHILDREN = { min: 0, max: 4 } as const;
export const FAKER_CHILDREN_MIN_ONE = { min: 1, max: 4 } as const;
export const FAKER_PETS = { min: 0, max: 3 } as const;
export const FAKER_PETS_MIN_ONE = { min: 1, max: 3 } as const;
export const FAKER_SUPPLY_DURATION_DAYS = { min: 3, max: 14 } as const;
export const FAKER_SUPPLY_DURATION_DAYS_LONG = { min: 7, max: 14 } as const;

// =============================================================================
// QUANTITY RANGES
// =============================================================================

export const FAKER_QUANTITY_SMALL = { min: 1, max: 10 } as const;
export const FAKER_QUANTITY_MEDIUM = { min: 1, max: 50 } as const;
export const FAKER_QUANTITY_LARGE = { min: 1, max: 100 } as const;
export const FAKER_QUANTITY_FLOAT = {
  min: 0.5,
  max: 10,
  fractionDigits: 1,
} as const;
export const FAKER_QUANTITY_FLOAT_MIN_ONE = {
  min: 1,
  max: 10,
  fractionDigits: 1,
} as const;

// =============================================================================
// PERCENTAGE RANGES
// =============================================================================

export const FAKER_PERCENTAGE_LOW = { min: 0, max: 30 } as const;
export const FAKER_PERCENTAGE_MID = { min: 20, max: 40 } as const;

// =============================================================================
// ADDITIONAL AMOUNT RANGES
// =============================================================================

export const FAKER_ADDITION_SMALL = { min: 0, max: 5 } as const;
export const FAKER_ADDITION_MEDIUM = { min: 1, max: 10 } as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a random integer for adults count
 */
export function randomAdults(): number {
  return faker.number.int(FAKER_ADULTS);
}

/**
 * Generate a random integer for children count
 */
export function randomChildren(): number {
  return faker.number.int(FAKER_CHILDREN);
}

/**
 * Generate a random integer for children count (minimum 1)
 */
export function randomChildrenMinOne(): number {
  return faker.number.int(FAKER_CHILDREN_MIN_ONE);
}

/**
 * Generate a random integer for pets count
 */
export function randomPets(): number {
  return faker.number.int(FAKER_PETS);
}

/**
 * Generate a random integer for pets count (minimum 1)
 */
export function randomPetsMinOne(): number {
  return faker.number.int(FAKER_PETS_MIN_ONE);
}

/**
 * Generate a random integer for supply duration in days
 */
export function randomSupplyDurationDays(): number {
  return faker.number.int(FAKER_SUPPLY_DURATION_DAYS);
}

/**
 * Generate a random integer for longer supply duration in days
 */
export function randomSupplyDurationDaysLong(): number {
  return faker.number.int(FAKER_SUPPLY_DURATION_DAYS_LONG);
}

/**
 * Generate a random quantity (small range)
 */
export function randomQuantitySmall(): number {
  return faker.number.int(FAKER_QUANTITY_SMALL);
}

/**
 * Generate a random quantity (medium range)
 */
export function randomQuantityMedium(): number {
  return faker.number.int(FAKER_QUANTITY_MEDIUM);
}

/**
 * Generate a random quantity (large range)
 */
export function randomQuantityLarge(): number {
  return faker.number.int(FAKER_QUANTITY_LARGE);
}

/**
 * Generate a random float quantity
 */
export function randomQuantityFloat(): number {
  return faker.number.float(FAKER_QUANTITY_FLOAT);
}

/**
 * Generate a random float quantity (minimum 1)
 */
export function randomQuantityFloatMinOne(): number {
  return faker.number.float(FAKER_QUANTITY_FLOAT_MIN_ONE);
}

/**
 * Generate a random value less than the given maximum
 */
export function randomLessThan(max: number): number {
  return faker.number.int({ min: 0, max: Math.max(0, max - 1) });
}

/**
 * Generate a random value more than the given minimum
 */
export function randomMoreThan(
  min: number,
  maxAdditional: number = 10,
): number {
  return min + faker.number.int({ min: 1, max: maxAdditional });
}

/**
 * Generate a random low completion percentage
 */
export function randomPercentageLow(): number {
  return faker.number.int(FAKER_PERCENTAGE_LOW);
}

/**
 * Generate a random mid-range completion percentage
 */
export function randomPercentageMid(): number {
  return faker.number.int(FAKER_PERCENTAGE_MID);
}
