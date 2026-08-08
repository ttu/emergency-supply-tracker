import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Guide } from './Guide';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

describe('Guide (v2)', () => {
  it('renders the CIVIL PREPAREDNESS title in cockpit voice', () => {
    renderWithProviders(<Guide />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(screen.getByText('v2.guide.title.cockpit')).toBeInTheDocument();
  });

  it('renders all nine guide sections by code (§1 – §9)', () => {
    renderWithProviders(<Guide />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    for (const code of ['§1', '§2', '§3', '§4', '§5', '§6', '§7', '§8', '§9']) {
      expect(screen.getByText(code)).toBeInTheDocument();
    }
  });

  it('renders the cockpit titles for the key sections', () => {
    renderWithProviders(<Guide />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(
      screen.getByText('v2.guide.sections.s1.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.guide.sections.s2.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.guide.sections.s3.title.cockpit'),
    ).toBeInTheDocument();
  });

  it('covers app usage — data backup, shopping list export and readiness scoring', () => {
    renderWithProviders(<Guide />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(
      screen.getByText('v2.guide.sections.s7.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.guide.sections.s8.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.guide.sections.s9.title.cockpit'),
    ).toBeInTheDocument();
  });

  it('offers a support section with an email link and a GitHub link', () => {
    renderWithProviders(<Guide />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(
      screen.getByText('v2.guide.supportTitle.cockpit'),
    ).toBeInTheDocument();
    const emailLink = screen.getByRole('link', {
      name: 'help@emergencysupplytracker.com',
    });
    expect(emailLink).toHaveAttribute(
      'href',
      'mailto:help@emergencysupplytracker.com',
    );
    const githubLink = screen.getByRole('link', {
      name: 'help.githubLink',
    });
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/ttu/emergency-supply-tracker',
    );
  });
});
