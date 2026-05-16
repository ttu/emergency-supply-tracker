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
    expect(screen.getByText('APPEARANCE')).toBeInTheDocument();
  });

  it('renders the theme + language sub-panels and a11y toggles', () => {
    render();
    expect(screen.getByText(/THEME · §1\.1/)).toBeInTheDocument();
    expect(screen.getByText(/LANGUAGE · §1\.2/)).toBeInTheDocument();
    expect(screen.getByText('HIGH CONTRAST MODE')).toBeInTheDocument();
    expect(screen.getByText('REDUCE MOTION')).toBeInTheDocument();
  });
});
