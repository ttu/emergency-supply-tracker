import type {
  HouseholdConfig,
  InventoryItem,
  RecommendedItemDefinition,
} from '@/shared/types';
import { createQuantity, createDateOnly } from '@/shared/types';
import { InventoryItemFactory } from '@/features/inventory/factories/InventoryItemFactory';
import { PET_REQUIREMENT_MULTIPLIER } from '@/shared/utils/constants';

/**
 * State distribution for example inventory items.
 * - full: 40% - Item has full recommended quantity with normal expiration
 * - partial: 25% - Item has 30-70% of recommended quantity
 * - missing: 20% - Item is not added to inventory
 * - expiring: 10% - Item expires within 7-30 days
 * - expired: 5% - Item has already expired (1-60 days ago)
 */
export interface ExampleItemState {
  type: 'full' | 'partial' | 'missing' | 'expiring' | 'expired';
  quantityMultiplier: number;
  expirationOffsetDays?: number;
}

/**
 * Seeded pseudo-random number generator for deterministic results.
 * Uses a simple linear congruential generator.
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    // LCG parameters (same as glibc)
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Shuffles an array using Fisher-Yates algorithm with seeded random.
 */
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Determines the state for an item based on its index in the shuffled array.
 * Distribution: 40% full, 25% partial, 20% missing, 10% expiring, 5% expired
 */
export function getStateForIndex(
  index: number,
  total: number,
  random?: () => number,
): ExampleItemState {
  // Guard against division by zero or invalid total
  if (total <= 0) {
    return { type: 'full', quantityMultiplier: 1.0 };
  }

  const percentage = (index / total) * 100;

  if (percentage < 40) {
    // Full: 0-40%
    return { type: 'full', quantityMultiplier: 1.0 };
  } else if (percentage < 65) {
    // Partial: 40-65%
    const rand = random ? random() : Math.random();
    const multiplier = 0.3 + rand * 0.4; // 0.3-0.7
    return { type: 'partial', quantityMultiplier: multiplier };
  } else if (percentage < 85) {
    // Missing: 65-85%
    return { type: 'missing', quantityMultiplier: 0 };
  } else if (percentage < 95) {
    // Expiring: 85-95%
    const rand = random ? random() : Math.random();
    const daysUntilExpiry = Math.floor(7 + rand * 23); // 7-30 days
    return {
      type: 'expiring',
      quantityMultiplier: 1.0,
      expirationOffsetDays: daysUntilExpiry,
    };
  } else {
    // Expired: 95-100%
    const rand = random ? random() : Math.random();
    const daysExpired = Math.floor(1 + rand * 59); // 1-60 days ago
    return {
      type: 'expired',
      quantityMultiplier: 0.5 + (random ? random() : Math.random()) * 0.5, // 0.5-1.0
      expirationOffsetDays: -daysExpired,
    };
  }
}

/**
 * Calculates recommended quantity for an item based on household config.
 */
function calculateRecommendedQuantity(
  item: RecommendedItemDefinition,
  household: HouseholdConfig,
): number {
  let quantity: number = item.baseQuantity;

  if (item.scaleWithPeople) {
    const totalPeople = household.adults + household.children;
    quantity *= totalPeople;
  }

  if (item.scaleWithPets && household.pets > 0) {
    quantity *= household.pets * PET_REQUIREMENT_MULTIPLIER;
  }

  if (item.scaleWithDays) {
    quantity *= household.supplyDurationDays;
  }

  return Math.ceil(quantity);
}

/**
 * Creates a DateOnly string offset from today.
 */
function createOffsetDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates an example inventory with varied item states.
 *
 * Creates a realistic demo inventory where:
 * - ~40% of items are fully stocked with valid expiration
 * - ~25% have partial quantities (30-70% of recommended)
 * - ~20% are missing (not added to inventory)
 * - ~10% are expiring soon (within 7-30 days)
 * - ~5% have already expired (1-60 days ago)
 *
 * @param recommendedItems - Array of recommended item definitions
 * @param household - Household configuration for quantity calculation
 * @param translateFn - Function to translate i18n keys to item names
 * @param seed - Optional seed for deterministic random generation (for testing)
 * @returns Array of InventoryItem objects representing the example inventory
 */
export function generateExampleInventory(
  recommendedItems: RecommendedItemDefinition[],
  household: HouseholdConfig,
  translateFn: (key: string) => string,
  seed?: number,
): InventoryItem[] {
  if (recommendedItems.length === 0) {
    return [];
  }

  const random = createSeededRandom(seed ?? Date.now());

  // Filter items based on household config
  const filteredItems = recommendedItems.filter((item) => {
    // Skip frozen items if not using freezer
    if (item.requiresFreezer && !household.useFreezer) {
      return false;
    }
    // Skip pet items if pets is 0
    if (item.scaleWithPets && household.pets === 0) {
      return false;
    }
    return true;
  });

  if (filteredItems.length === 0) {
    return [];
  }

  // Shuffle items for random distribution
  const shuffledItems = shuffleArray(filteredItems, random);
  const totalItems = shuffledItems.length;

  const inventoryItems: InventoryItem[] = [];

  shuffledItems.forEach((item, index) => {
    const state = getStateForIndex(index, totalItems, random);

    // Skip missing items
    if (state.type === 'missing') {
      return;
    }

    // Calculate quantity
    const recommendedQty = calculateRecommendedQuantity(item, household);
    const actualQty = Math.max(
      1,
      Math.ceil(recommendedQty * state.quantityMultiplier),
    );

    // Determine expiration date
    let expirationDate: string | undefined;
    const hasExpiration = !!item.defaultExpirationMonths;

    if (hasExpiration) {
      if (state.expirationOffsetDays !== undefined) {
        // Use the state's offset (for expiring/expired items)
        expirationDate = createOffsetDate(state.expirationOffsetDays);
      } else {
        // Calculate default expiration based on template
        const defaultMonths = item.defaultExpirationMonths!;
        // Add some variance: 50-100% of default expiration time
        const variance = 0.5 + random() * 0.5;
        const daysUntil = Math.floor(defaultMonths * 30 * variance);
        expirationDate = createOffsetDate(daysUntil);
      }
    }

    // Translate item name
    const normalizedKey = item.i18nKey.replace(/^(products\.|custom\.)/, '');
    const itemName = translateFn(normalizedKey);

    // Create the inventory item using the factory
    const inventoryItem = InventoryItemFactory.createFromTemplate(
      item,
      household,
      {
        name: itemName,
        quantity: createQuantity(actualQty),
        expirationDate: expirationDate
          ? createDateOnly(expirationDate)
          : undefined,
      },
    );

    inventoryItems.push(inventoryItem);
  });

  return inventoryItems;
}
