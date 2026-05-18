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

  it('renders all six guide sections by code (§1 – §6)', () => {
    renderWithProviders(<Guide />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    for (const code of ['§1', '§2', '§3', '§4', '§5', '§6']) {
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
});
