import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NutritionSettings } from './NutritionSettings';
import { SettingsContext } from '@/features/settings';
import { createMockSettings } from '@/shared/utils/test/factories';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

// Mock i18next
vi.mock('react-i18next', () => ({
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
  const defaultSettings = createMockSettings({
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
  });

  const renderWithContext = (
    settings: ReturnType<typeof createMockSettings> = defaultSettings,
    updateSettings = vi.fn(),
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

  it('calls updateSettings when calories input changes and loses focus', () => {
    const updateSettings = vi.fn();
    renderWithContext(defaultSettings, updateSettings);

    const caloriesInput = screen.getByLabelText(/daily calories/i);
    fireEvent.change(caloriesInput, { target: { value: '2500' } });
    fireEvent.blur(caloriesInput);

    expect(updateSettings).toHaveBeenCalledWith({
      dailyCaloriesPerPerson: 2500,
    });
  });

  it('calls updateSettings when water input changes and loses focus', () => {
    const updateSettings = vi.fn();
    renderWithContext(defaultSettings, updateSettings);

    const waterInput = screen.getByLabelText(/daily water/i);
    fireEvent.change(waterInput, { target: { value: '4' } });
    fireEvent.blur(waterInput);

    expect(updateSettings).toHaveBeenCalledWith({
      dailyWaterPerPerson: 4,
    });
  });

  it('calls updateSettings when children percentage changes and loses focus', () => {
    const updateSettings = vi.fn();
    renderWithContext(defaultSettings, updateSettings);

    const childrenInput = screen.getByLabelText(/children.*requirements/i);
    fireEvent.change(childrenInput, { target: { value: '80' } });
    fireEvent.blur(childrenInput);

    expect(updateSettings).toHaveBeenCalledWith({
      childrenRequirementPercentage: 80,
    });
  });

  it('clamps values to minimum on blur', () => {
    const updateSettings = vi.fn();
    renderWithContext(defaultSettings, updateSettings);

    const caloriesInput = screen.getByLabelText(/daily calories/i);
    fireEvent.change(caloriesInput, { target: { value: '500' } });
    fireEvent.blur(caloriesInput);

    // Should clamp to minimum 1000
    expect(updateSettings).toHaveBeenCalledWith({
      dailyCaloriesPerPerson: 1000,
    });
  });

  it('clamps values to maximum on blur', () => {
    const updateSettings = vi.fn();
    renderWithContext(defaultSettings, updateSettings);

    const caloriesInput = screen.getByLabelText(/daily calories/i);
    fireEvent.change(caloriesInput, { target: { value: '10000' } });
    fireEvent.blur(caloriesInput);

    // Should clamp to maximum 5000
    expect(updateSettings).toHaveBeenCalledWith({
      dailyCaloriesPerPerson: 5000,
    });
  });

  it('resets all values to defaults when reset button clicked', () => {
    const updateSettings = vi.fn();
    const customSettings = createMockSettings({
      ...defaultSettings,
      dailyCaloriesPerPerson: 2500,
      dailyWaterPerPerson: 4,
      childrenRequirementPercentage: 80,
    });
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
    const settingsWithoutNutrition = createMockSettings({
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
      // Intentionally omitting nutrition settings
    });
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

  it('resets calories to current value when invalid input on blur', () => {
    const updateSettings = vi.fn();
    renderWithContext(defaultSettings, updateSettings);

    const caloriesInput = screen.getByLabelText(
      /daily calories/i,
    ) as HTMLInputElement;
    fireEvent.change(caloriesInput, { target: { value: 'abc' } });
    fireEvent.blur(caloriesInput);

    // Should not call updateSettings for invalid input
    expect(updateSettings).not.toHaveBeenCalled();
    // Should reset to current value
    expect(caloriesInput.value).toBe(String(DAILY_CALORIES_PER_PERSON));
  });

  it('resets water to current value when invalid input on blur', () => {
    const updateSettings = vi.fn();
    renderWithContext(defaultSettings, updateSettings);

    const waterInput = screen.getByLabelText(
      /daily water/i,
    ) as HTMLInputElement;
    fireEvent.change(waterInput, { target: { value: '' } });
    fireEvent.blur(waterInput);

    // Should not call updateSettings for invalid input
    expect(updateSettings).not.toHaveBeenCalled();
    // Should reset to current value
    expect(waterInput.value).toBe(String(DAILY_WATER_PER_PERSON));
  });

  it('resets children percentage to current value when invalid input on blur', () => {
    const updateSettings = vi.fn();
    renderWithContext(defaultSettings, updateSettings);

    const childrenInput = screen.getByLabelText(
      /children.*requirements/i,
    ) as HTMLInputElement;
    fireEvent.change(childrenInput, { target: { value: 'invalid' } });
    fireEvent.blur(childrenInput);

    // Should not call updateSettings for invalid input
    expect(updateSettings).not.toHaveBeenCalled();
    // Should reset to current value
    expect(childrenInput.value).toBe(
      String(CHILDREN_REQUIREMENT_MULTIPLIER * 100),
    );
  });
});
