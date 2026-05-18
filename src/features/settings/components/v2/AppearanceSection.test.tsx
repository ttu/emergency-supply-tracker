import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AppearanceSection } from './AppearanceSection';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

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
});
