import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { NutritionSection } from './NutritionSection';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const render = () =>
  renderWithProviders(<NutritionSection />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('NutritionSection (v2)', () => {
  it('renders the §4 NUTRITION & REQUIREMENTS header and stepper labels', () => {
    renderWithProviders(<NutritionSection />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(screen.getByText('§4')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.calories.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.water.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.children.cockpit'),
    ).toBeInTheDocument();
  });

  it('offers no control the app does not act on', () => {
    // "Track hygiene water separately" was stored and read back to draw its
    // own switch while no calculation ever consulted it, so the promised
    // 3 L/person/day never entered any figure.
    render();
    expect(
      screen.queryByText('v2.settings.nutrition.hygiene.cockpit'),
    ).not.toBeInTheDocument();
  });

  it('reports the expiry window from the threshold the alerts actually use', () => {
    render();
    expect(
      screen.getByText('v2.settings.nutrition.expiryWindowValue'),
    ).toBeInTheDocument();
  });
});
