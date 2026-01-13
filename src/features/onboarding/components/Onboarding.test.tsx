import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from './Onboarding';
import { SettingsProvider } from '@/features/settings';

// Mock react-i18next
const mockChangeLanguage = vi.fn();
vi.mock('react-i18next', () => ({
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
        'actions.back': 'Back',
        'quickSetup.addItems': 'Add Selected Items',
        'quickSetup.skip': 'Skip',
        'quickSetup.showDetails': 'Show Details',
        'quickSetup.hideDetails': 'Hide Details',
        'quickSetup.selectAll': 'Select All',
        'quickSetup.deselectAll': 'Deselect All',
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
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    expect(screen.getByTestId('get-started-button')).toBeInTheDocument();
  });

  it('progresses from welcome to preset selection', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });
  });

  it('progresses from preset to household form', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Welcome -> Preset
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    // Preset -> Household
    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    const singlePreset = screen.getByTestId('preset-single');
    await user.click(singlePreset);

    await waitFor(() => {
      expect(screen.getByTestId('household-save-button')).toBeInTheDocument();
    });
  });

  it('allows going back from preset to welcome', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Welcome -> Preset
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    // Preset -> Welcome (back button)
    const backButton = screen.getByTestId('preset-back-button');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('get-started-button')).toBeInTheDocument();
    });
  });

  it('allows going back from household form to preset', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Welcome -> Preset
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    // Preset -> Household
    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    const singlePreset = screen.getByTestId('preset-single');
    await user.click(singlePreset);

    await waitFor(() => {
      expect(screen.getByTestId('household-back-button')).toBeInTheDocument();
    });

    // Household -> Preset
    const backButton = screen.getByTestId('household-back-button');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });
  });

  it('allows going back from quick setup to household', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Navigate to quick setup
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    const singlePreset = screen.getByTestId('preset-single');
    await user.click(singlePreset);

    await waitFor(() => {
      expect(screen.getByTestId('household-save-button')).toBeInTheDocument();
    });

    const continueButton = screen.getByTestId('household-save-button');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('skip-quick-setup-button')).toBeInTheDocument();
    });

    // Quick Setup -> Household (back button)
    const backButton = screen.getByTestId('quick-setup-back-button');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('household-save-button')).toBeInTheDocument();
    });
  });

  it('calls onComplete with household config when skip is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Navigate to quick setup
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    const singlePreset = screen.getByTestId('preset-single');
    await user.click(singlePreset);

    await waitFor(() => {
      expect(screen.getByTestId('household-save-button')).toBeInTheDocument();
    });

    const continueButton = screen.getByTestId('household-save-button');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('skip-quick-setup-button')).toBeInTheDocument();
    });

    const skipButton = screen.getByTestId('skip-quick-setup-button');
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
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Navigate to quick setup
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    const singlePreset = screen.getByTestId('preset-single');
    await user.click(singlePreset);

    await waitFor(() => {
      expect(screen.getByTestId('household-save-button')).toBeInTheDocument();
    });

    const continueButton = screen.getByTestId('household-save-button');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-items-button')).toBeInTheDocument();
    });

    // Select some items first (button is disabled when no items selected)
    const showDetailsButton = screen.getByTestId('show-details-button');
    await user.click(showDetailsButton);

    // Select first item
    const checkboxes = screen.getAllByRole('checkbox');
    const firstItemCheckbox = checkboxes.find((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );
    if (firstItemCheckbox) {
      await user.click(firstItemCheckbox);
    }

    const addItemsButton = screen.getByTestId('add-items-button');
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
          quantity: expect.any(Number),
        }),
      ]),
    );
  });

  it('adds preselected items with quantity 1 when some items are selected', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Navigate to quick setup
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    const singlePreset = screen.getByTestId('preset-single');
    await user.click(singlePreset);

    await waitFor(() => {
      expect(screen.getByTestId('household-save-button')).toBeInTheDocument();
    });

    const continueButton = screen.getByTestId('household-save-button');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-items-button')).toBeInTheDocument();
    });

    // Show details and select one item (not all)
    const showDetailsButton = screen.getByTestId('show-details-button');
    await user.click(showDetailsButton);

    const checkboxes = screen.getAllByRole('checkbox');
    const itemCheckboxes = checkboxes.filter((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );

    // Select only the first item (some, but not all)
    if (itemCheckboxes.length > 0) {
      await user.click(itemCheckboxes[0]);
    }

    const addItemsButton = screen.getByTestId('add-items-button');
    await user.click(addItemsButton);

    // Verify items were added with quantity 1
    expect(onComplete).toHaveBeenCalled();
    const [, items] = onComplete.mock.calls[0];
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item: { quantity: number }) => {
      expect(item.quantity).toBe(1);
    });
  });

  it('adds preselected items with quantity 0 when all items are selected', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Navigate to quick setup
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    const singlePreset = screen.getByTestId('preset-single');
    await user.click(singlePreset);

    await waitFor(() => {
      expect(screen.getByTestId('household-save-button')).toBeInTheDocument();
    });

    const continueButton = screen.getByTestId('household-save-button');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-items-button')).toBeInTheDocument();
    });

    // Show details and select all items
    const showDetailsButton = screen.getByTestId('show-details-button');
    await user.click(showDetailsButton);

    // Click "Select All" button
    const selectAllButton = screen.getByTestId('select-all-button');
    await user.click(selectAllButton);

    const addItemsButton = screen.getByTestId('add-items-button');
    await user.click(addItemsButton);

    // Verify items were added with quantity 0
    expect(onComplete).toHaveBeenCalled();
    const [, items] = onComplete.mock.calls[0];
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item: { quantity: number }) => {
      expect(item.quantity).toBe(0);
    });
  });

  it('filters out frozen items when household does not use freezer', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SettingsProvider>
        <Onboarding onComplete={onComplete} />
      </SettingsProvider>,
    );

    // Navigate to household form
    const getStartedButton = screen.getByTestId('get-started-button');
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-single')).toBeInTheDocument();
    });

    const singlePreset = screen.getByTestId('preset-single');
    await user.click(singlePreset);

    await waitFor(() => {
      expect(screen.getByTestId('household-save-button')).toBeInTheDocument();
    });

    // Ensure freezer checkbox is unchecked (to test filtering)
    const freezerCheckbox = screen.getByLabelText(
      /I want to use my freezer/i,
    ) as HTMLInputElement;
    // If it's checked, uncheck it; if it's not checked, leave it as is
    if (freezerCheckbox.checked) {
      await user.click(freezerCheckbox);
      await waitFor(() => {
        expect(freezerCheckbox).not.toBeChecked();
      });
    }

    // Submit form
    const continueButton = screen.getByTestId('household-save-button');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-items-button')).toBeInTheDocument();
    });

    // Show details and select a frozen item (if available in the list)
    const showDetailsButton = screen.getByTestId('show-details-button');
    await user.click(showDetailsButton);

    // Try to find and select a frozen item (frozen-vegetables, frozen-meat, or frozen-meals)
    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      const id = checkbox.getAttribute('id');
      if (
        id &&
        (id.includes('frozen-vegetables') ||
          id.includes('frozen-meat') ||
          id.includes('frozen-meals'))
      ) {
        await user.click(checkbox);
        break;
      }
    }

    // Also select a non-frozen item to ensure we have at least one item
    const nonFrozenCheckbox = checkboxes.find(
      (cb) =>
        cb.getAttribute('id')?.startsWith('item-') &&
        !cb.getAttribute('id')?.includes('frozen-'),
    );
    if (nonFrozenCheckbox) {
      await user.click(nonFrozenCheckbox);
    }

    const addItemsButton = screen.getByTestId('add-items-button');
    await user.click(addItemsButton);

    // Verify onComplete was called
    expect(onComplete).toHaveBeenCalled();

    // Get the items that were passed to onComplete
    const callArgs = onComplete.mock.calls[0];
    const items = callArgs[1] as Array<{ id: string }>;

    // Verify that no frozen items are included
    const frozenItemIds = items
      .map((item) => item.id)
      .filter(
        (id) =>
          id.includes('frozen-vegetables') ||
          id.includes('frozen-meat') ||
          id.includes('frozen-meals'),
      );

    expect(frozenItemIds).toHaveLength(0);

    // Verify that household config has useFreezer: false
    expect(callArgs[0]).toMatchObject({
      useFreezer: false,
    });
  });
});
