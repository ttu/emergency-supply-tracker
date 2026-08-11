import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AppearanceSection } from './AppearanceSection';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const { changeLanguageSpy } = vi.hoisted(() => ({
  changeLanguageSpy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-i18next', async () => {
  const { createI18nMock } = await import('@/test/i18n');
  return createI18nMock({
    changeLanguage: changeLanguageSpy,
    translations: {
      'v2.settings.appearance.languageOption.en': 'English',
      'v2.settings.appearance.languageOption.fi': 'Suomi',
    },
  });
});

const render = () =>
  renderWithProviders(<AppearanceSection />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('AppearanceSection (v2)', () => {
  it('renders the §1 APPEARANCE header', () => {
    render();
    expect(screen.getByText('§1')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.appearance.title.cockpit'),
    ).toBeInTheDocument();
  });

  it('renders the theme + language sub-panels and a11y toggles', () => {
    render();
    expect(
      screen.getByText('v2.settings.appearance.themeHeader.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.appearance.languageHeader.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.appearance.highContrast.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.appearance.reduceMotion.cockpit'),
    ).toBeInTheDocument();
  });
  it('applies the language to i18next, not just to stored settings', () => {
    // Storing `language` alone leaves i18next on the old bundle, so the UI
    // only catches up on the next reload. The classic LanguageSelector calls
    // changeLanguage alongside updateSettings; v2 has to do the same.
    render();
    changeLanguageSpy.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Suomi/ }));

    expect(changeLanguageSpy).toHaveBeenCalledWith('fi');
  });
});
