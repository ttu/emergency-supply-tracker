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
        'settings.language': 'Language',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: jest.fn(() => Promise.resolve()),
    },
  }),
}));

jest.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { language: 'en' },
    updateSettings: jest.fn(),
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

    expect(screen.getByText(/📦 Track Supplies/i)).toBeInTheDocument();
    expect(screen.getByText(/🔔 Get Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/📊 Stay Prepared/i)).toBeInTheDocument();
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
});
