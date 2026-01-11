import { describe, it, expect } from 'vitest';
import {
  UserSettingsFactory,
  UserSettingsValidationError,
  type CreateUserSettingsInput,
} from './UserSettingsFactory';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import { VALID_THEMES } from '@/shared/types';
import { faker } from '@faker-js/faker';

describe('UserSettingsFactory', () => {
  describe('create', () => {
    it('creates default settings when no input provided', () => {
      const settings = UserSettingsFactory.create();

      expect(settings.language).toBe('en');
      expect(settings.theme).toBe('ocean');
      expect(settings.highContrast).toBe(false);
      expect(settings.advancedFeatures.calorieTracking).toBe(false);
      expect(settings.advancedFeatures.powerManagement).toBe(false);
      expect(settings.advancedFeatures.waterTracking).toBe(false);
      expect(settings.dailyCaloriesPerPerson).toBe(DAILY_CALORIES_PER_PERSON);
      expect(settings.dailyWaterPerPerson).toBe(DAILY_WATER_PER_PERSON);
      expect(settings.childrenRequirementPercentage).toBe(
        CHILDREN_REQUIREMENT_MULTIPLIER * 100,
      );
    });

    it('creates settings with custom values', () => {
      const language = faker.helpers.arrayElement(['en', 'fi']);
      const theme = faker.helpers.arrayElement(VALID_THEMES);
      const highContrast = faker.datatype.boolean();
      const calorieTracking = faker.datatype.boolean();
      const powerManagement = faker.datatype.boolean();
      const waterTracking = faker.datatype.boolean();
      const dailyCaloriesPerPerson = faker.number.int({ min: 1000, max: 5000 });
      const dailyWaterPerPerson = faker.number.float({
        min: 1,
        max: 10,
        fractionDigits: 1,
      });
      const childrenRequirementPercentage = faker.number.int({
        min: 0,
        max: 100,
      });

      const input: CreateUserSettingsInput = {
        language,
        theme,
        highContrast,
        advancedFeatures: {
          calorieTracking,
          powerManagement,
          waterTracking,
        },
        dailyCaloriesPerPerson,
        dailyWaterPerPerson,
        childrenRequirementPercentage,
      };

      const settings = UserSettingsFactory.create(input);

      expect(settings.language).toBe(language);
      expect(settings.theme).toBe(theme);
      expect(settings.highContrast).toBe(highContrast);
      expect(settings.advancedFeatures.calorieTracking).toBe(calorieTracking);
      expect(settings.advancedFeatures.powerManagement).toBe(powerManagement);
      expect(settings.advancedFeatures.waterTracking).toBe(waterTracking);
      expect(settings.dailyCaloriesPerPerson).toBe(dailyCaloriesPerPerson);
      expect(settings.dailyWaterPerPerson).toBe(dailyWaterPerPerson);
      expect(settings.childrenRequirementPercentage).toBe(
        childrenRequirementPercentage,
      );
    });

    it('merges advancedFeatures correctly', () => {
      const input: CreateUserSettingsInput = {
        advancedFeatures: {
          calorieTracking: true,
          powerManagement: false,
          waterTracking: false,
        },
      };

      const settings = UserSettingsFactory.create(input);

      expect(settings.advancedFeatures.calorieTracking).toBe(true);
      expect(settings.advancedFeatures.powerManagement).toBe(false); // Default
      expect(settings.advancedFeatures.waterTracking).toBe(false); // Default
    });

    it('throws error when language is invalid', () => {
      expect(() => {
        UserSettingsFactory.create({
          // @ts-expect-error - Testing invalid input
          language: 'invalid',
        });
      }).toThrow(UserSettingsValidationError);
    });

    it('throws error when theme is invalid', () => {
      expect(() => {
        UserSettingsFactory.create({
          // @ts-expect-error - Testing invalid input
          theme: 'invalid',
        });
      }).toThrow(UserSettingsValidationError);
    });

    it('throws error when dailyCaloriesPerPerson is negative', () => {
      expect(() => {
        UserSettingsFactory.create({
          dailyCaloriesPerPerson: -1,
        });
      }).toThrow(UserSettingsValidationError);
    });

    it('throws error when dailyWaterPerPerson is negative', () => {
      expect(() => {
        UserSettingsFactory.create({
          dailyWaterPerPerson: -1,
        });
      }).toThrow(UserSettingsValidationError);
    });

    it('throws error when childrenRequirementPercentage is negative', () => {
      expect(() => {
        UserSettingsFactory.create({
          childrenRequirementPercentage: -1,
        });
      }).toThrow(UserSettingsValidationError);
    });

    it('throws error when childrenRequirementPercentage exceeds 100', () => {
      expect(() => {
        UserSettingsFactory.create({
          childrenRequirementPercentage: 101,
        });
      }).toThrow(UserSettingsValidationError);
    });

    it('allows all valid languages', () => {
      const languages = ['en', 'fi'] as const;

      languages.forEach((lang) => {
        const settings = UserSettingsFactory.create({ language: lang });
        expect(settings.language).toBe(lang);
      });
    });

    it('allows all valid themes', () => {
      const themes = [
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

      themes.forEach((theme) => {
        const settings = UserSettingsFactory.create({ theme });
        expect(settings.theme).toBe(theme);
      });
    });

    it('allows zero for numeric fields', () => {
      const settings = UserSettingsFactory.create({
        dailyCaloriesPerPerson: 0,
        dailyWaterPerPerson: 0,
        childrenRequirementPercentage: 0,
      });

      expect(settings.dailyCaloriesPerPerson).toBe(0);
      expect(settings.dailyWaterPerPerson).toBe(0);
      expect(settings.childrenRequirementPercentage).toBe(0);
    });

    it('allows 100 for childrenRequirementPercentage', () => {
      const settings = UserSettingsFactory.create({
        childrenRequirementPercentage: 100,
      });

      expect(settings.childrenRequirementPercentage).toBe(100);
    });
  });

  describe('createDefault', () => {
    it('creates default settings', () => {
      const settings = UserSettingsFactory.createDefault();

      expect(settings.language).toBe('en');
      expect(settings.theme).toBe('ocean');
      expect(settings.highContrast).toBe(false);
    });
  });
});
