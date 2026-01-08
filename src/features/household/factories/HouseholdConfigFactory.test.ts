import { describe, it, expect } from 'vitest';
import {
  HouseholdConfigFactory,
  HouseholdConfigValidationError,
  type CreateHouseholdConfigInput,
} from './HouseholdConfigFactory';
import { HOUSEHOLD_LIMITS } from '../constants';
import {
  randomAdults,
  randomChildren,
  randomSupplyDurationDays,
} from '@/shared/utils/test/faker-helpers';
import { faker } from '@faker-js/faker';

describe('HouseholdConfigFactory', () => {
  describe('create', () => {
    it('creates a valid household config', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const supplyDurationDays = randomSupplyDurationDays();
      const useFreezer = faker.datatype.boolean();

      const input: CreateHouseholdConfigInput = {
        adults,
        children,
        supplyDurationDays,
        useFreezer,
      };

      const config = HouseholdConfigFactory.create(input);

      expect(config.adults).toBe(adults);
      expect(config.children).toBe(children);
      expect(config.supplyDurationDays).toBe(supplyDurationDays);
      expect(config.useFreezer).toBe(useFreezer);
    });

    it('handles optional freezerHoldTimeHours', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const supplyDurationDays = randomSupplyDurationDays();
      const freezerHoldTimeHours = faker.number.int({ min: 24, max: 72 });

      const input: CreateHouseholdConfigInput = {
        adults,
        children,
        supplyDurationDays,
        useFreezer: true,
        freezerHoldTimeHours,
      };

      const config = HouseholdConfigFactory.create(input);

      expect(config.adults).toBe(adults);
      expect(config.children).toBe(children);
      expect(config.supplyDurationDays).toBe(supplyDurationDays);
      expect(config.useFreezer).toBe(true);
      expect(config.freezerHoldTimeHours).toBe(freezerHoldTimeHours);
    });

    it('throws error when adults is below minimum', () => {
      const children = randomChildren();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults: 0,
          children,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when adults exceeds maximum', () => {
      const children = randomChildren();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults: HOUSEHOLD_LIMITS.adults.max + 1,
          children,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when children is below minimum', () => {
      const adults = randomAdults();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children: -1,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when children exceeds maximum', () => {
      const adults = randomAdults();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children: HOUSEHOLD_LIMITS.children.max + 1,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when supplyDurationDays is below minimum', () => {
      const adults = randomAdults();
      const children = randomChildren();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children,
          supplyDurationDays: 0,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when supplyDurationDays exceeds maximum', () => {
      const adults = randomAdults();
      const children = randomChildren();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children,
          supplyDurationDays: HOUSEHOLD_LIMITS.supplyDays.max + 1,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when freezerHoldTimeHours is negative', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children,
          supplyDurationDays,
          useFreezer: true,
          freezerHoldTimeHours: -1,
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('allows values at limits', () => {
      const config1 = HouseholdConfigFactory.create({
        adults: HOUSEHOLD_LIMITS.adults.min,
        children: HOUSEHOLD_LIMITS.children.min,
        supplyDurationDays: HOUSEHOLD_LIMITS.supplyDays.min,
        useFreezer: false,
      });

      expect(config1.adults).toBe(HOUSEHOLD_LIMITS.adults.min);
      expect(config1.children).toBe(HOUSEHOLD_LIMITS.children.min);
      expect(config1.supplyDurationDays).toBe(HOUSEHOLD_LIMITS.supplyDays.min);

      const config2 = HouseholdConfigFactory.create({
        adults: HOUSEHOLD_LIMITS.adults.max,
        children: HOUSEHOLD_LIMITS.children.max,
        supplyDurationDays: HOUSEHOLD_LIMITS.supplyDays.max,
        useFreezer: false,
      });

      expect(config2.adults).toBe(HOUSEHOLD_LIMITS.adults.max);
      expect(config2.children).toBe(HOUSEHOLD_LIMITS.children.max);
      expect(config2.supplyDurationDays).toBe(HOUSEHOLD_LIMITS.supplyDays.max);
    });

    it('creates valid configs with random valid values', () => {
      // Using faker to test with random valid values within limits
      const randomAdults = faker.number.int({
        min: HOUSEHOLD_LIMITS.adults.min,
        max: HOUSEHOLD_LIMITS.adults.max,
      });
      const randomChildren = faker.number.int({
        min: HOUSEHOLD_LIMITS.children.min,
        max: HOUSEHOLD_LIMITS.children.max,
      });
      const randomDays = faker.number.int({
        min: HOUSEHOLD_LIMITS.supplyDays.min,
        max: HOUSEHOLD_LIMITS.supplyDays.max,
      });
      const randomUseFreezer = faker.datatype.boolean();

      const config = HouseholdConfigFactory.create({
        adults: randomAdults,
        children: randomChildren,
        supplyDurationDays: randomDays,
        useFreezer: randomUseFreezer,
      });

      expect(config.adults).toBe(randomAdults);
      expect(config.children).toBe(randomChildren);
      expect(config.supplyDurationDays).toBe(randomDays);
      expect(config.useFreezer).toBe(randomUseFreezer);
    });
  });

  describe('createFromPreset', () => {
    it('creates single preset', () => {
      const config = HouseholdConfigFactory.createFromPreset('single');

      expect(config.adults).toBe(1);
      expect(config.children).toBe(0);
      expect(config.supplyDurationDays).toBe(3);
      expect(config.useFreezer).toBe(false);
    });

    it('creates couple preset', () => {
      const config = HouseholdConfigFactory.createFromPreset('couple');

      expect(config.adults).toBe(2);
      expect(config.children).toBe(0);
      expect(config.supplyDurationDays).toBe(3);
      expect(config.useFreezer).toBe(true);
    });

    it('creates family preset', () => {
      const config = HouseholdConfigFactory.createFromPreset('family');

      expect(config.adults).toBe(2);
      expect(config.children).toBe(2);
      expect(config.supplyDurationDays).toBe(3);
      expect(config.useFreezer).toBe(true);
    });
  });

  describe('createDefault', () => {
    it('creates default config', () => {
      const config = HouseholdConfigFactory.createDefault();

      expect(config.adults).toBe(2);
      expect(config.children).toBe(0);
      expect(config.supplyDurationDays).toBe(7);
      expect(config.useFreezer).toBe(false);
    });

    it('allows overrides', () => {
      const adults = randomAdults();
      const children = randomChildren();

      const config = HouseholdConfigFactory.createDefault({
        adults,
        children,
      });

      expect(config.adults).toBe(adults);
      expect(config.children).toBe(children);
      expect(config.supplyDurationDays).toBe(7); // Default
      expect(config.useFreezer).toBe(false); // Default
    });
  });
});
