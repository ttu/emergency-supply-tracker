import { render, screen, fireEvent } from '@testing-library/react';
import { NutritionSettings } from './NutritionSettings';
import { SettingsContext } from '@/shared/contexts/SettingsContext';
import type { UserSettings } from '@/shared/types';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'settings.nutrition.description': 'Customize daily requirements',
        'settings.nutrition.dailyCalories': 'Daily Calories per Person',
        'settings.nutrition.dailyCaloriesHint': `Default: ${params?.default || 2000} kcal`,
        'settings.nutrition.dailyWater': 'Daily Water per Person',
        'settings.nutrition.dailyWaterHint': `Default: ${params?.default || 3} liters`,
        'settings.nutrition.litersPerDay': 'liters/day',
        'settings.nutrition.childrenPercentage': "Children's Requirements",
        'settings.nutrition.childrenPercentageHint': `Default: ${params?.default || 75}%`,
        'settings.nutrition.resetToDefaults': 'Reset to Defaults',
      };
      return translations[key] || key;
    },
  }),
}));

describe('NutritionSettings', () => {
  const defaultSettings: UserSettings = {
    language: 'en',
    theme: 'light',
    highContrast: false,
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
    dailyCaloriesPerPerson: DAILY_CALORIES_PER_PERSON,
    dailyWaterPerPerson: DAILY_WATER_PER_PERSON,
    childrenRequirementPercentage: CHILDREN_REQUIREMENT_MULTIPLIER * 100,
  };

  const renderWithContext = (
    settings: UserSettings = defaultSettings,
    updateSettings = jest.fn(),
  ) => {
    return render(
      <SettingsContext.Provider value={{ settings, updateSettings }}>
        <NutritionSettings />
      </SettingsContext.Provider>,
    );
  };

  it('renders all input fields', () => {
    renderWithContext();

    expect(screen.getByLabelText(/daily calories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily water/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/children.*requirements/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reset to defaults/i }),
    ).toBeInTheDocument();
  });

  it('displays default values', () => {
    renderWithContext();

    const caloriesInput = screen.getByLabelText(
      /daily calories/i,
    ) as HTMLInputElement;
    const waterInput = screen.getByLabelText(
      /daily water/i,
    ) as HTMLInputElement;
    const childrenInput = screen.getByLabelText(
      /children.*requirements/i,
    ) as HTMLInputElement;

    expect(caloriesInput.value).toBe(String(DAILY_CALORIES_PER_PERSON));
    expect(waterInput.value).toBe(String(DAILY_WATER_PER_PERSON));
    expect(childrenInput.value).toBe(
      String(CHILDREN_REQUIREMENT_MULTIPLIER * 100),
    );
  });

  it('calls updateSettings when calories input changes', () => {
    const updateSettings = jest.fn();
    renderWithContext(defaultSettings, updateSettings);

    const caloriesInput = screen.getByLabelText(/daily calories/i);
    fireEvent.change(caloriesInput, { target: { value: '2500' } });

    expect(updateSettings).toHaveBeenCalledWith({
      dailyCaloriesPerPerson: 2500,
    });
  });

  it('calls updateSettings when water input changes', () => {
    const updateSettings = jest.fn();
    renderWithContext(defaultSettings, updateSettings);

    const waterInput = screen.getByLabelText(/daily water/i);
    fireEvent.change(waterInput, { target: { value: '4' } });

    expect(updateSettings).toHaveBeenCalledWith({
      dailyWaterPerPerson: 4,
    });
  });

  it('calls updateSettings when children percentage changes', () => {
    const updateSettings = jest.fn();
    renderWithContext(defaultSettings, updateSettings);

    const childrenInput = screen.getByLabelText(/children.*requirements/i);
    fireEvent.change(childrenInput, { target: { value: '80' } });

    expect(updateSettings).toHaveBeenCalledWith({
      childrenRequirementPercentage: 80,
    });
  });

  it('clamps values to minimum', () => {
    const updateSettings = jest.fn();
    renderWithContext(defaultSettings, updateSettings);

    const caloriesInput = screen.getByLabelText(/daily calories/i);
    fireEvent.change(caloriesInput, { target: { value: '500' } });

    // Should clamp to minimum 1000
    expect(updateSettings).toHaveBeenCalledWith({
      dailyCaloriesPerPerson: 1000,
    });
  });

  it('clamps values to maximum', () => {
    const updateSettings = jest.fn();
    renderWithContext(defaultSettings, updateSettings);

    const caloriesInput = screen.getByLabelText(/daily calories/i);
    fireEvent.change(caloriesInput, { target: { value: '10000' } });

    // Should clamp to maximum 5000
    expect(updateSettings).toHaveBeenCalledWith({
      dailyCaloriesPerPerson: 5000,
    });
  });

  it('resets all values to defaults when reset button clicked', () => {
    const updateSettings = jest.fn();
    const customSettings: UserSettings = {
      ...defaultSettings,
      dailyCaloriesPerPerson: 2500,
      dailyWaterPerPerson: 4,
      childrenRequirementPercentage: 80,
    };
    renderWithContext(customSettings, updateSettings);

    const resetButton = screen.getByRole('button', {
      name: /reset to defaults/i,
    });
    fireEvent.click(resetButton);

    expect(updateSettings).toHaveBeenCalledWith({
      dailyCaloriesPerPerson: DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson: DAILY_WATER_PER_PERSON,
      childrenRequirementPercentage: CHILDREN_REQUIREMENT_MULTIPLIER * 100,
    });
  });

  it('uses defaults when settings values are undefined', () => {
    const settingsWithoutNutrition: UserSettings = {
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
      // Intentionally omitting nutrition settings
    };
    renderWithContext(settingsWithoutNutrition);

    const caloriesInput = screen.getByLabelText(
      /daily calories/i,
    ) as HTMLInputElement;
    const waterInput = screen.getByLabelText(
      /daily water/i,
    ) as HTMLInputElement;
    const childrenInput = screen.getByLabelText(
      /children.*requirements/i,
    ) as HTMLInputElement;

    expect(caloriesInput.value).toBe(String(DAILY_CALORIES_PER_PERSON));
    expect(waterInput.value).toBe(String(DAILY_WATER_PER_PERSON));
    expect(childrenInput.value).toBe(
      String(CHILDREN_REQUIREMENT_MULTIPLIER * 100),
    );
  });
});
