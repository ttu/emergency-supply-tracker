import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeScreen } from './WelcomeScreen';

// Mock the hooks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.title': 'Emergency Supply Tracker',
        'app.tagline': 'Track your emergency supplies and stay prepared',
        'settings.language.label': 'Language',
        'settings.language.option.en': '🇬🇧 English',
        'settings.language.option.fi': '🇫🇮 Suomi',
        'settings.theme.label': 'Theme',
        'settings.theme.light': 'Light',
        'settings.theme.dark': 'Dark',
        'settings.theme.midnight': 'Midnight',
        'settings.theme.ocean': 'Ocean',
        'settings.theme.sunset': 'Sunset',
        'settings.theme.forest': 'Forest',
        'settings.theme.lavender': 'Lavender',
        'settings.theme.minimal': 'Minimal',
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
      changeLanguage: vi.fn(() => Promise.resolve()),
    },
  }),
}));

const mockUpdateSettings = vi.fn();

vi.mock('@/features/settings', () => ({
  useSettings: () => ({
    settings: { language: 'en', theme: 'ocean' },
    updateSettings: mockUpdateSettings,
  }),
}));

describe('WelcomeScreen', () => {
  it('renders the welcome screen with title and tagline', () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('Emergency Supply Tracker')).toBeInTheDocument();
    expect(
      screen.getByText('Track your emergency supplies and stay prepared'),
    ).toBeInTheDocument();
  });

  it('renders language selector', () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('renders feature highlights', () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('Track Supplies')).toBeInTheDocument();
    expect(screen.getByText('Get Alerts')).toBeInTheDocument();
    expect(screen.getByText('Stay Prepared')).toBeInTheDocument();
  });

  it('renders selling points', () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('No Signup Required')).toBeInTheDocument();
    expect(screen.getByText('100% Browser-Based')).toBeInTheDocument();
    expect(screen.getByText('Completely Free')).toBeInTheDocument();
    expect(screen.getByText('Cloud Sync (Coming Soon)')).toBeInTheDocument();
  });

  it('calls onContinue when Get Started button is clicked', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    const button = screen.getByRole('button', { name: /get started/i });
    await user.click(button);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders language options', () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText(/English/)).toBeInTheDocument();
    expect(screen.getByText(/Suomi/)).toBeInTheDocument();
  });

  it('renders works offline selling point', () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByText('Works Offline')).toBeInTheDocument();
  });

  it('calls updateSettings when language selector is changed', async () => {
    mockUpdateSettings.mockClear();
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    const languageSelect = screen.getByLabelText('Language');
    await user.selectOptions(languageSelect, 'fi');

    // The handleLanguageChange function should call updateSettings
    expect(mockUpdateSettings).toHaveBeenCalledWith({ language: 'fi' });
  });

  it('renders theme selector', () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
  });

  it('renders theme options', () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    const themeSelect = screen.getByLabelText('Theme');
    expect(themeSelect).toBeInTheDocument();

    // Check that theme options are available
    expect(screen.getByRole('option', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ocean' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Midnight' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sunset' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Forest' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Lavender' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Minimal' })).toBeInTheDocument();
  });

  it('calls updateSettings when theme selector is changed', async () => {
    mockUpdateSettings.mockClear();
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    const themeSelect = screen.getByLabelText('Theme');
    await user.selectOptions(themeSelect, 'dark');

    expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'dark' });
  });
});
