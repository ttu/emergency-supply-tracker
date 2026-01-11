import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  SettingsContext,
  type SettingsContextValue,
} from '@/features/settings';

// Create mock before vi.mock hoisting
const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);

// Mock react-i18next with custom changeLanguage function
// Using inline mock that creates its own i18n mock to work with vi hoisting
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

const createMockSettingsContext = (
  overrides?: Partial<SettingsContextValue>,
): SettingsContextValue => ({
  settings: {
    language: 'en',
    theme: 'light',
    highContrast: false,
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
  },
  updateSettings: vi.fn(),
  ...overrides,
});

const renderWithContext = (
  component: ReactNode,
  contextValue: SettingsContextValue = createMockSettingsContext(),
) => {
  return render(
    <SettingsContext.Provider value={contextValue}>
      {component}
    </SettingsContext.Provider>,
  );
};

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render language selector', () => {
    renderWithContext(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should show English and Suomi options', () => {
    renderWithContext(<LanguageSwitcher />);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Suomi')).toBeInTheDocument();
  });

  it('should have current language selected', () => {
    const context = createMockSettingsContext();
    context.settings.language = 'fi';
    renderWithContext(<LanguageSwitcher />, context);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('fi');
  });

  it('should change language when selecting a different option', () => {
    const mockUpdateSettings = vi.fn();
    const context = createMockSettingsContext({
      updateSettings: mockUpdateSettings,
    });

    renderWithContext(<LanguageSwitcher />, context);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'fi' } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ language: 'fi' });
    expect(mockChangeLanguage).toHaveBeenCalledWith('fi');
  });

  it('should handle language change error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockChangeLanguage.mockRejectedValueOnce(new Error('Failed to change'));

    const mockUpdateSettings = vi.fn();
    const context = createMockSettingsContext({
      updateSettings: mockUpdateSettings,
    });

    renderWithContext(<LanguageSwitcher />, context);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'fi' } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ language: 'fi' });

    // Wait for the promise rejection to be handled
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to change language:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
