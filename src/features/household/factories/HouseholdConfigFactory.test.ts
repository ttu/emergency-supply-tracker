import { describe, it, expect } from '@jest/globals';
import {
  HouseholdConfigFactory,
  HouseholdConfigValidationError,
  type CreateHouseholdConfigInput,
} from './HouseholdConfigFactory';
import { HOUSEHOLD_LIMITS } from '../constants';

describe('HouseholdConfigFactory', () => {
  describe('create', () => {
    it('creates a valid household config', () => {
      const input: CreateHouseholdConfigInput = {
        adults: 2,
        children: 1,
        supplyDurationDays: 7,
        useFreezer: false,
      };

      const config = HouseholdConfigFactory.create(input);

      expect(config.adults).toBe(2);
      expect(config.children).toBe(1);
      expect(config.supplyDurationDays).toBe(7);
      expect(config.useFreezer).toBe(false);
    });

    it('handles optional freezerHoldTimeHours', () => {
      const input: CreateHouseholdConfigInput = {
        adults: 2,
        children: 1,
        supplyDurationDays: 7,
        useFreezer: true,
        freezerHoldTimeHours: 48,
      };

      const config = HouseholdConfigFactory.create(input);

      expect(config.freezerHoldTimeHours).toBe(48);
    });

    it('throws error when adults is below minimum', () => {
      expect(() => {
        HouseholdConfigFactory.create({
          adults: 0,
          children: 0,
          supplyDurationDays: 7,
          useFreezer: false,
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when adults exceeds maximum', () => {
      expect(() => {
        HouseholdConfigFactory.create({
          adults: HOUSEHOLD_LIMITS.adults.max + 1,
          children: 0,
          supplyDurationDays: 7,
          useFreezer: false,
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when children is below minimum', () => {
      expect(() => {
        HouseholdConfigFactory.create({
          adults: 2,
          children: -1,
          supplyDurationDays: 7,
          useFreezer: false,
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when children exceeds maximum', () => {
      expect(() => {
        HouseholdConfigFactory.create({
          adults: 2,
          children: HOUSEHOLD_LIMITS.children.max + 1,
          supplyDurationDays: 7,
          useFreezer: false,
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when supplyDurationDays is below minimum', () => {
      expect(() => {
        HouseholdConfigFactory.create({
          adults: 2,
          children: 1,
          supplyDurationDays: 0,
          useFreezer: false,
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when supplyDurationDays exceeds maximum', () => {
      expect(() => {
        HouseholdConfigFactory.create({
          adults: 2,
          children: 1,
          supplyDurationDays: HOUSEHOLD_LIMITS.supplyDays.max + 1,
          useFreezer: false,
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when freezerHoldTimeHours is negative', () => {
      expect(() => {
        HouseholdConfigFactory.create({
          adults: 2,
          children: 1,
          supplyDurationDays: 7,
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
      const config = HouseholdConfigFactory.createDefault({
        adults: 3,
        children: 2,
      });

      expect(config.adults).toBe(3);
      expect(config.children).toBe(2);
      expect(config.supplyDurationDays).toBe(7); // Default
      expect(config.useFreezer).toBe(false); // Default
    });
  });
});
