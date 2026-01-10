import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { SettingsProvider } from './provider';
import { useSettings } from './hooks';
import * as localStorage from '@/shared/utils/storage/localStorage';
import * as urlLanguage from '@/shared/utils/urlLanguage';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';

// Mock dependencies
vi.mock('@/shared/utils/storage/localStorage');
vi.mock('@/shared/utils/urlLanguage');

const TestComponent = () => {
  const { settings } = useSettings();
  return <div data-testid="language">{settings.language}</div>;
};

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default settings when no stored data', () => {
    vi.mocked(localStorage.getAppData).mockReturnValue(null);
    vi.mocked(localStorage.createDefaultAppData).mockReturnValue({
      version: CURRENT_SCHEMA_VERSION,
      settings: {
        language: 'en',
        theme: 'ocean',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      items: [],
      customCategories: [],
      customTemplates: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      lastModified: new Date().toISOString(),
    });
    vi.mocked(urlLanguage.getLanguageFromUrl).mockReturnValue(null);
    vi.mocked(urlLanguage.clearLanguageFromUrl).mockImplementation(() => {});

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>,
    );

    expect(getByTestId('language')).toHaveTextContent('en');
  });

  it('initializes with stored settings', () => {
    vi.mocked(localStorage.getAppData).mockReturnValue({
      version: CURRENT_SCHEMA_VERSION,
      settings: {
        language: 'fi',
        theme: 'dark',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      items: [],
      customCategories: [],
      customTemplates: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      lastModified: new Date().toISOString(),
    });
    vi.mocked(urlLanguage.getLanguageFromUrl).mockReturnValue(null);
    vi.mocked(urlLanguage.clearLanguageFromUrl).mockImplementation(() => {});

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>,
    );

    expect(getByTestId('language')).toHaveTextContent('fi');
  });

  it('overrides stored language with URL language parameter', () => {
    vi.mocked(localStorage.getAppData).mockReturnValue({
      version: CURRENT_SCHEMA_VERSION,
      settings: {
        language: 'en',
        theme: 'ocean',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      items: [],
      customCategories: [],
      customTemplates: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      lastModified: new Date().toISOString(),
    });
    vi.mocked(urlLanguage.getLanguageFromUrl).mockReturnValue('fi');
    vi.mocked(urlLanguage.clearLanguageFromUrl).mockImplementation(() => {});

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>,
    );

    expect(getByTestId('language')).toHaveTextContent('fi');
    expect(urlLanguage.clearLanguageFromUrl).toHaveBeenCalled();
  });
});
