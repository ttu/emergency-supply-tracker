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
    expect(screen.getByText('SETTINGS')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM CONFIGURATION')).toBeInTheDocument();
  });

  it('renders the SettingsRail with all 11 section labels', () => {
    setup();
    expect(
      screen.getByRole('button', { name: /01.*APPEARANCE/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /02.*HOUSEHOLD/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /03.*INVENTORY SETS/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /04.*NUTRITION/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /05.*ADVANCED/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /06.*NOTIFICATIONS/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /07.*RECOMMENDATIONS/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /08.*CATEGORIES/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /09.*DATA & BACKUP/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /10.*ABOUT/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /11.*DANGER ZONE/ }),
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
      screen.getByRole('button', { name: /BACK TO TOP/ }),
    ).toBeInTheDocument();
  });
});
