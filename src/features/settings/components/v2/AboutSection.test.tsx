import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AboutSection } from './AboutSection';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

describe('AboutSection (v2)', () => {
  it('renders the §10 ABOUT header and external links panel', () => {
    renderWithProviders(<AboutSection />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(screen.getByText('§10')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.about.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.about.linksHeader.cockpit'),
    ).toBeInTheDocument();
  });

  it('renders github + bug tracker + contact links', () => {
    renderWithProviders(<AboutSection />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(
      screen.getByRole('link', {
        name: /v2\.settings\.about\.linkSource\.cockpit/,
      }),
    ).toHaveAttribute(
      'href',
      'https://github.com/ttu/emergency-supply-tracker',
    );
    expect(
      screen.getByRole('link', {
        name: /v2\.settings\.about\.linkBugs\.cockpit/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /v2\.settings\.about\.linkContact\.cockpit/,
      }),
    ).toBeInTheDocument();
  });
});
