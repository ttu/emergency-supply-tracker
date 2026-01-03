import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from './Onboarding';
import { SettingsProvider } from '@/shared/contexts/SettingsProvider';

// Mock react-i18next
const mockChangeLanguage = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.title': 'Emergency Supply Tracker',
        'app.tagline': 'Be prepared for emergencies',
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
        'household.title': 'Household Setup',
        'household.presets.single': 'Single Person',
        'household.presets.couple': 'Couple',
        'household.presets.family': 'Family',
        'household.adults': 'Adults',
        'household.children': 'Children',
        'household.supplyDays': 'Supply Days',
        'household.useFreezer': 'I want to use my freezer',
        'actions.save': 'Save',
        'actions.cancel': 'Cancel',
        'quickSetup.addItems': 'Add Items',
        'quickSetup.skip': 'Skip',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe('Onboarding', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear();
  });

  it('renders welcome screen initially', () => {
    const onComplete = jest.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('progresses from welcome to preset selection', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    const getStartedButton = screen.getByText('Get Started');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText('Single Person')).toBeInTheDocument();
    });
  });

  it('progresses from preset to household form', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Welcome -> Preset
    const getStartedButton = screen.getByText('Get Started');
    await user.click(getStartedButton);

    // Preset -> Household
    await waitFor(() => {
      expect(screen.getByText('Single Person')).toBeInTheDocument();
    });

    const singlePreset = screen.getByText('Single Person').closest('div');
    if (singlePreset) {
      await user.click(singlePreset);
    }

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  it('allows going back from household form to preset', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Welcome -> Preset
    const getStartedButton = screen.getByText('Get Started');
    await user.click(getStartedButton);

    // Preset -> Household
    await waitFor(() => {
      expect(screen.getByText('Single Person')).toBeInTheDocument();
    });

    const singlePreset = screen.getByText('Single Person').closest('div');
    if (singlePreset) {
      await user.click(singlePreset);
    }

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Household -> Preset
    const backButton = screen.getByText('Cancel');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('Single Person')).toBeInTheDocument();
    });
  });

  it('calls onComplete with household config when skip is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Navigate to quick setup
    const getStartedButton = screen.getByText('Get Started');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText('Single Person')).toBeInTheDocument();
    });

    const singlePreset = screen.getByText('Single Person').closest('div');
    if (singlePreset) {
      await user.click(singlePreset);
    }

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    const continueButton = screen.getByText('Save');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    const skipButton = screen.getByText('Skip');
    await user.click(skipButton);

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        adults: expect.any(Number),
        children: expect.any(Number),
        supplyDurationDays: expect.any(Number),
        useFreezer: expect.any(Boolean),
      }),
      [],
    );
  });

  it('calls onComplete with household config and items when add items is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Navigate to quick setup
    const getStartedButton = screen.getByText('Get Started');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText('Single Person')).toBeInTheDocument();
    });

    const singlePreset = screen.getByText('Single Person').closest('div');
    if (singlePreset) {
      await user.click(singlePreset);
    }

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    const continueButton = screen.getByText('Save');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Add Items')).toBeInTheDocument();
    });

    const addItemsButton = screen.getByText('Add Items');
    await user.click(addItemsButton);

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        adults: expect.any(Number),
        children: expect.any(Number),
        supplyDurationDays: expect.any(Number),
        useFreezer: expect.any(Boolean),
      }),
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          categoryId: expect.any(String),
          quantity: 0,
          recommendedQuantity: expect.any(Number),
        }),
      ]),
    );
  });
});
