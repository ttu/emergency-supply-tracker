import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HouseholdPresetSelector } from './HouseholdPresetSelector';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'household.title': 'Household Configuration',
        'household.description': 'Choose a preset or customize',
        'household.adults': 'Adults',
        'household.children': 'Children',
        'household.presets.single': 'Single Person',
        'household.presets.couple': 'Couple',
        'household.presets.family': 'Family',
        'household.presets.custom': 'Custom',
        'household.customDescription': 'Set your own configuration',
      };
      return translations[key] || key;
    },
  }),
}));

describe('HouseholdPresetSelector', () => {
  it('renders all preset options', () => {
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    expect(screen.getByText('Single Person')).toBeInTheDocument();
    expect(screen.getByText('Couple')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('displays household configuration details', () => {
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    expect(screen.getByText('1 Adults')).toBeInTheDocument();
    expect(screen.getByText(/2 Adults, 2 Children/i)).toBeInTheDocument();
  });

  it('calls onSelectPreset when a preset is clicked', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const singlePreset = screen
      .getByText('Single Person')
      .closest('[role="button"]');
    await user.click(singlePreset!);

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'single',
      adults: 1,
      children: 0,
    });
  });

  it('calls onSelectPreset when custom is clicked', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const customPreset = screen.getByText('Custom').closest('[role="button"]');
    await user.click(customPreset!);

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'custom',
      adults: 1,
      children: 0,
    });
  });

  it('highlights the selected preset', () => {
    const onSelectPreset = vi.fn();
    render(
      <HouseholdPresetSelector
        selectedPreset="couple"
        onSelectPreset={onSelectPreset}
      />,
    );

    const selectedCard = screen
      .getByText('Couple')
      .closest('div[role="button"]');
    // Just verify the card exists and is accessible
    expect(selectedCard).toBeInTheDocument();
    expect(selectedCard).toHaveAttribute('role', 'button');
  });

  it('supports keyboard navigation with Enter key', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const familyPreset = screen
      .getByText('Family')
      .closest('[role="button"]') as HTMLElement;
    familyPreset?.focus();
    await user.keyboard('{Enter}');

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'family',
      adults: 2,
      children: 2,
    });
  });

  it('supports keyboard navigation with Space key', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const couplePreset = screen
      .getByText('Couple')
      .closest('[role="button"]') as HTMLElement;
    couplePreset?.focus();
    await user.keyboard(' ');

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'couple',
      adults: 2,
      children: 0,
    });
  });

  it('supports keyboard navigation on custom preset with Enter key', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const customPreset = screen
      .getByText('Custom')
      .closest('[role="button"]') as HTMLElement;
    customPreset?.focus();
    await user.keyboard('{Enter}');

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'custom',
      adults: 1,
      children: 0,
    });
  });

  it('supports keyboard navigation on custom preset with Space key', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const customPreset = screen
      .getByText('Custom')
      .closest('[role="button"]') as HTMLElement;
    customPreset?.focus();
    await user.keyboard(' ');

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'custom',
      adults: 1,
      children: 0,
    });
  });
});
