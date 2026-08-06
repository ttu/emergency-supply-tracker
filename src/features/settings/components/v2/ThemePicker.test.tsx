import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

// The default mock echoes keys without interpolating, which would hide
// whether the real figures ever reach the card.
vi.mock('react-i18next', async () => {
  const { createI18nMock } = await import('@/test/i18n');
  return createI18nMock({
    translations: {
      'v2.settings.appearance.themePreview.cockpit':
        'READINESS · {{readiness}}% · {{days}}D · {{expiring}} EXP',
      'v2.settings.appearance.themePreview.civil':
        'READINESS {{readiness}}% · {{days}} DAYS · {{expiring}} EXPIRING',
      'v2.settings.appearance.themePreview.pantry':
        'Readiness {{readiness}}% · {{days}} days · {{expiring}} expiring',
    },
  });
});

import { ThemePicker } from './ThemePicker';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderPicker = (
  value: Parameters<typeof ThemePicker>[0]['value'] = 'cockpit',
  onChange = vi.fn(),
) =>
  renderWithProviders(<ThemePicker value={value} onChange={onChange} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('ThemePicker (v2)', () => {
  it('renders a radiogroup with one radio per v2 theme', () => {
    renderPicker();
    expect(
      screen.getByRole('radiogroup', { name: 'Theme' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the active theme as aria-checked', () => {
    renderPicker('civil');
    const radios = screen.getAllByRole('radio');
    const civilRadio = radios.find((r) =>
      r.textContent?.toLowerCase().includes('civil'),
    );
    expect(civilRadio).toHaveAttribute('aria-checked', 'true');
  });

  it('clicking a theme calls onChange with its key', () => {
    const onChange = vi.fn();
    renderPicker('cockpit', onChange);
    const radios = screen.getAllByRole('radio');
    const pantry = radios.find((r) =>
      r.textContent?.toLowerCase().includes('pantry'),
    )!;
    fireEvent.click(pantry);
    expect(onChange).toHaveBeenCalledWith('pantry');
  });

  it('previews the household’s own figures when they are supplied', () => {
    renderWithProviders(
      <ThemePicker
        value="cockpit"
        onChange={vi.fn()}
        preview={{ readiness: 42, daysCovered: 2.7, expiringCount: 3 }}
      />,
      {
        initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
      },
    );

    // One line per card, carrying the real numbers rather than a fixed string.
    expect(screen.getAllByText(/42/)).toHaveLength(3);
  });

  it('omits the figures line when there is nothing to report', () => {
    // Onboarding shows the picker before any inventory exists; inventing a
    // readiness there would be the same lie in a different place.
    renderPicker();
    expect(screen.queryByText(/READINESS/i)).not.toBeInTheDocument();
  });
});
