import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { SettingsFull } from './SettingsFull';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

const setup = () =>
  renderWithProviders(<SettingsFull />, {
    initialAppData: createMockAppData({
      settings: createMockSettings({ theme: 'cockpit' }),
    }),
  });

describe('SettingsFull (v2 orchestrator)', () => {
  it('renders the page title and lead copy in cockpit voice', () => {
    setup();
    expect(screen.getByText('v2.settings.title.cockpit')).toBeInTheDocument();
    expect(screen.getByText('v2.settings.intro.cockpit')).toBeInTheDocument();
  });

  it('renders the SettingsRail with all 11 section labels', () => {
    setup();
    expect(
      screen.getByRole('button', {
        name: /01.*v2.settings.nav.appearance.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /02.*v2.settings.nav.household.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /03.*v2.settings.nav.inventorysets.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /04.*v2.settings.nav.nutrition.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /05.*v2.settings.nav.advanced.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /06.*v2.settings.nav.notifications.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /07.*v2.settings.nav.recommendations.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /08.*v2.settings.nav.categories.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /09.*v2.settings.nav.data.cockpit/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /10.*v2.settings.nav.about.cockpit/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /11.*v2.settings.nav.danger.cockpit/,
      }),
    ).toBeInTheDocument();
  });

  it('renders every section header (§1 – §11)', () => {
    setup();
    for (const code of [
      '§1',
      '§2',
      '§3',
      '§4',
      '§5',
      '§6',
      '§7',
      '§8',
      '§9',
      '§10',
      '§11',
    ]) {
      expect(screen.getByText(code)).toBeInTheDocument();
    }
  });

  it('renders the BACK TO TOP footer button', () => {
    setup();
    expect(
      screen.getByRole('button', { name: /v2.settings.backToTop.cockpit/ }),
    ).toBeInTheDocument();
  });
});
