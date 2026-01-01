import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeScreen } from './WelcomeScreen';

// Mock the hooks
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.title': 'Emergency Supply Tracker',
        'app.tagline': 'Track your emergency supplies and stay prepared',
        'settings.language.label': 'Language',
        'landing.getStarted': 'Get Started',
        'landing.noSignup.title': 'No Signup Required',
        'landing.noSignup.description': 'Start using immediately',
        'landing.browserBased.title': '100% Browser-Based',
        'landing.browserBased.description': 'Your data stays on your device',
        'landing.free.title': 'Completely Free',
        'landing.free.description': 'All features included',
        'landing.cloudSync.title': 'Cloud Sync (Coming Soon)',
        'landing.cloudSync.description': 'Optional sync to your cloud',
        'landing.features.track.title': 'Track Supplies',
        'landing.features.track.description': 'Keep track of your supplies',
        'landing.features.alerts.title': 'Get Alerts',
        'landing.features.alerts.description': 'Get notified when low',
        'landing.features.prepared.title': 'Stay Prepared',
        'landing.features.prepared.description': 'Be ready for emergencies',
        'landing.worksOffline.title': 'Works Offline',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: jest.fn(() => Promise.resolve()),
    },
  }),
}));

const mockUpdateSettings = jest.fn();

jest.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { language: 'en' },
    updateSettings: mockUpdateSettings,
  }),
}));

describe('WelcomeScreen', () => {
  it('renders the welcome screen with title and tagline', () => {
    const onContinue = jest.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('Emergency Supply Tracker')).toBeInTheDocument();
    expect(
      screen.getByText('Track your emergency supplies and stay prepared'),
    ).toBeInTheDocument();
  });

  it('renders language selector', () => {
    const onContinue = jest.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders feature highlights', () => {
    const onContinue = jest.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('Track Supplies')).toBeInTheDocument();
    expect(screen.getByText('Get Alerts')).toBeInTheDocument();
    expect(screen.getByText('Stay Prepared')).toBeInTheDocument();
  });

  it('renders selling points', () => {
    const onContinue = jest.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('No Signup Required')).toBeInTheDocument();
    expect(screen.getByText('100% Browser-Based')).toBeInTheDocument();
    expect(screen.getByText('Completely Free')).toBeInTheDocument();
    expect(screen.getByText('Cloud Sync (Coming Soon)')).toBeInTheDocument();
  });

  it('calls onContinue when Get Started button is clicked', async () => {
    const user = userEvent.setup();
    const onContinue = jest.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    const button = screen.getByRole('button', { name: /get started/i });
    await user.click(button);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders language options', () => {
    const onContinue = jest.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Suomi')).toBeInTheDocument();
  });

  it('renders works offline selling point', () => {
    const onContinue = jest.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('Works Offline')).toBeInTheDocument();
  });

  it('calls updateSettings when language selector is changed', async () => {
    mockUpdateSettings.mockClear();
    const user = userEvent.setup();
    const onContinue = jest.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    const languageSelect = screen.getByRole('combobox');
    await user.selectOptions(languageSelect, 'fi');

    // The handleLanguageChange function should call updateSettings
    expect(mockUpdateSettings).toHaveBeenCalledWith({ language: 'fi' });
  });
});
