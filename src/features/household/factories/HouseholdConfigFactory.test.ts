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
  randomPets,
  randomSupplyDurationDays,
} from '@/shared/utils/test/faker-helpers';
import { faker } from '@faker-js/faker';

describe('HouseholdConfigFactory', () => {
  describe('create', () => {
    it('creates a valid household config', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const pets = randomPets();
      const supplyDurationDays = randomSupplyDurationDays();
      const useFreezer = faker.datatype.boolean();

      const input: CreateHouseholdConfigInput = {
        adults,
        children,
        pets,
        supplyDurationDays,
        useFreezer,
      };

      const config = HouseholdConfigFactory.create(input);

      expect(config.adults).toBe(adults);
      expect(config.children).toBe(children);
      expect(config.pets).toBe(pets);
      expect(config.supplyDurationDays).toBe(supplyDurationDays);
      expect(config.useFreezer).toBe(useFreezer);
    });

    it('handles optional freezerHoldTimeHours', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const pets = randomPets();
      const supplyDurationDays = randomSupplyDurationDays();
      const freezerHoldTimeHours = faker.number.int({ min: 24, max: 72 });

      const input: CreateHouseholdConfigInput = {
        adults,
        children,
        pets,
        supplyDurationDays,
        useFreezer: true,
        freezerHoldTimeHours,
      };

      const config = HouseholdConfigFactory.create(input);

      expect(config.adults).toBe(adults);
      expect(config.children).toBe(children);
      expect(config.pets).toBe(pets);
      expect(config.supplyDurationDays).toBe(supplyDurationDays);
      expect(config.useFreezer).toBe(true);
      expect(config.freezerHoldTimeHours).toBe(freezerHoldTimeHours);
    });

    it('throws error when adults is below minimum', () => {
      const children = randomChildren();
      const pets = randomPets();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults: 0,
          children,
          pets,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when adults exceeds maximum', () => {
      const children = randomChildren();
      const pets = randomPets();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults: HOUSEHOLD_LIMITS.adults.max + 1,
          children,
          pets,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when children is below minimum', () => {
      const adults = randomAdults();
      const pets = randomPets();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children: -1,
          pets,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when children exceeds maximum', () => {
      const adults = randomAdults();
      const pets = randomPets();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children: HOUSEHOLD_LIMITS.children.max + 1,
          pets,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when pets is below minimum', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children,
          pets: -1,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when pets exceeds maximum', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children,
          pets: HOUSEHOLD_LIMITS.pets.max + 1,
          supplyDurationDays,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when supplyDurationDays is below minimum', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const pets = randomPets();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children,
          pets,
          supplyDurationDays: 0,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when supplyDurationDays exceeds maximum', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const pets = randomPets();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children,
          pets,
          supplyDurationDays: HOUSEHOLD_LIMITS.supplyDays.max + 1,
          useFreezer: faker.datatype.boolean(),
        });
      }).toThrow(HouseholdConfigValidationError);
    });

    it('throws error when freezerHoldTimeHours is negative', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const pets = randomPets();
      const supplyDurationDays = randomSupplyDurationDays();

      expect(() => {
        HouseholdConfigFactory.create({
          adults,
          children,
          pets,
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
        pets: HOUSEHOLD_LIMITS.pets.min,
        supplyDurationDays: HOUSEHOLD_LIMITS.supplyDays.min,
        useFreezer: false,
      });

      expect(config1.adults).toBe(HOUSEHOLD_LIMITS.adults.min);
      expect(config1.children).toBe(HOUSEHOLD_LIMITS.children.min);
      expect(config1.pets).toBe(HOUSEHOLD_LIMITS.pets.min);
      expect(config1.supplyDurationDays).toBe(HOUSEHOLD_LIMITS.supplyDays.min);

      const config2 = HouseholdConfigFactory.create({
        adults: HOUSEHOLD_LIMITS.adults.max,
        children: HOUSEHOLD_LIMITS.children.max,
        pets: HOUSEHOLD_LIMITS.pets.max,
        supplyDurationDays: HOUSEHOLD_LIMITS.supplyDays.max,
        useFreezer: false,
      });

      expect(config2.adults).toBe(HOUSEHOLD_LIMITS.adults.max);
      expect(config2.children).toBe(HOUSEHOLD_LIMITS.children.max);
      expect(config2.pets).toBe(HOUSEHOLD_LIMITS.pets.max);
      expect(config2.supplyDurationDays).toBe(HOUSEHOLD_LIMITS.supplyDays.max);
    });

    it('creates valid configs with random valid values', () => {
      // Using faker to test with random valid values within limits
      const randomAdultsVal = faker.number.int({
        min: HOUSEHOLD_LIMITS.adults.min,
        max: HOUSEHOLD_LIMITS.adults.max,
      });
      const randomChildrenVal = faker.number.int({
        min: HOUSEHOLD_LIMITS.children.min,
        max: HOUSEHOLD_LIMITS.children.max,
      });
      const randomPetsVal = faker.number.int({
        min: HOUSEHOLD_LIMITS.pets.min,
        max: HOUSEHOLD_LIMITS.pets.max,
      });
      const randomDays = faker.number.int({
        min: HOUSEHOLD_LIMITS.supplyDays.min,
        max: HOUSEHOLD_LIMITS.supplyDays.max,
      });
      const randomUseFreezer = faker.datatype.boolean();

      const config = HouseholdConfigFactory.create({
        adults: randomAdultsVal,
        children: randomChildrenVal,
        pets: randomPetsVal,
        supplyDurationDays: randomDays,
        useFreezer: randomUseFreezer,
      });

      expect(config.adults).toBe(randomAdultsVal);
      expect(config.children).toBe(randomChildrenVal);
      expect(config.pets).toBe(randomPetsVal);
      expect(config.supplyDurationDays).toBe(randomDays);
      expect(config.useFreezer).toBe(randomUseFreezer);
    });
  });

  describe('createFromPreset', () => {
    it('creates single preset', () => {
      const config = HouseholdConfigFactory.createFromPreset('single');

      expect(config.adults).toBe(1);
      expect(config.children).toBe(0);
      expect(config.pets).toBe(0);
      expect(config.supplyDurationDays).toBe(3);
      expect(config.useFreezer).toBe(false);
    });

    it('creates couple preset', () => {
      const config = HouseholdConfigFactory.createFromPreset('couple');

      expect(config.adults).toBe(2);
      expect(config.children).toBe(0);
      expect(config.pets).toBe(0);
      expect(config.supplyDurationDays).toBe(3);
      expect(config.useFreezer).toBe(true);
    });

    it('creates family preset', () => {
      const config = HouseholdConfigFactory.createFromPreset('family');

      expect(config.adults).toBe(2);
      expect(config.children).toBe(2);
      expect(config.pets).toBe(1);
      expect(config.supplyDurationDays).toBe(3);
      expect(config.useFreezer).toBe(true);
    });
  });

  describe('createDefault', () => {
    it('creates default config', () => {
      const config = HouseholdConfigFactory.createDefault();

      expect(config.adults).toBe(2);
      expect(config.children).toBe(0);
      expect(config.pets).toBe(0);
      expect(config.supplyDurationDays).toBe(7);
      expect(config.useFreezer).toBe(false);
    });

    it('allows overrides', () => {
      const adults = randomAdults();
      const children = randomChildren();
      const pets = randomPets();

      const config = HouseholdConfigFactory.createDefault({
        adults,
        children,
        pets,
      });

      expect(config.adults).toBe(adults);
      expect(config.children).toBe(children);
      expect(config.pets).toBe(pets);
      expect(config.supplyDurationDays).toBe(7); // Default
      expect(config.useFreezer).toBe(false); // Default
    });
  });
});
