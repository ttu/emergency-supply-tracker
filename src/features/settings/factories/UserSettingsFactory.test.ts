import { describe, it, expect } from '@jest/globals';
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
      const input: CreateUserSettingsInput = {
        language: 'fi',
        theme: 'dark',
        highContrast: true,
        advancedFeatures: {
          calorieTracking: true,
          powerManagement: true,
          waterTracking: false,
        },
        dailyCaloriesPerPerson: 2500,
        dailyWaterPerPerson: 4,
        childrenRequirementPercentage: 80,
      };

      const settings = UserSettingsFactory.create(input);

      expect(settings.language).toBe('fi');
      expect(settings.theme).toBe('dark');
      expect(settings.highContrast).toBe(true);
      expect(settings.advancedFeatures.calorieTracking).toBe(true);
      expect(settings.advancedFeatures.powerManagement).toBe(true);
      expect(settings.advancedFeatures.waterTracking).toBe(false);
      expect(settings.dailyCaloriesPerPerson).toBe(2500);
      expect(settings.dailyWaterPerPerson).toBe(4);
      expect(settings.childrenRequirementPercentage).toBe(80);
    });

    it('merges advancedFeatures correctly', () => {
      const input: CreateUserSettingsInput = {
        advancedFeatures: {
          calorieTracking: true,
        },
      };

      const settings = UserSettingsFactory.create(input);

      expect(settings.advancedFeatures.calorieTracking).toBe(true);
      expect(settings.advancedFeatures.powerManagement).toBe(false); // Default
      expect(settings.advancedFeatures.waterTracking).toBe(false); // Default
    });

    it('throws error when language is invalid', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        UserSettingsFactory.create({
          language: 'invalid',
        });
      }).toThrow(UserSettingsValidationError);
    });

    it('throws error when theme is invalid', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        UserSettingsFactory.create({
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
