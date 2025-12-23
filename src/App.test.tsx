import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import App from './App';
import { SettingsProvider } from './contexts/SettingsProvider';
import { HouseholdProvider } from './contexts/HouseholdProvider';
import { InventoryProvider } from './contexts/InventoryProvider';

// Create a fresh i18n instance for testing
const i18nInstance = createInstance();

i18nInstance.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      common: {
        app: {
          title: 'Emergency Supply Tracker',
          tagline: 'Track your emergency supplies and stay prepared',
        },
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18nInstance}>
      <SettingsProvider>
        <HouseholdProvider>
          <InventoryProvider>{component}</InventoryProvider>
        </HouseholdProvider>
      </SettingsProvider>
    </I18nextProvider>,
  );
};

describe('App', () => {
  it('renders app title', () => {
    renderWithProviders(<App />);
    // Translation keys are rendered as-is in tests when i18n is synchronous
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders language switcher', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Suomi')).toBeInTheDocument();
  });
});
