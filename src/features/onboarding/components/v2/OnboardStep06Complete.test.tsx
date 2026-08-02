import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardStep06Complete } from './OnboardStep06Complete';
import { renderWithProviders } from '@/test/render';
import {
  createMockHousehold,
  createMockSettings,
} from '@/shared/utils/test/factories';

const renderStep = (onComplete = vi.fn()) =>
  renderWithProviders(
    <OnboardStep06Complete
      household={createMockHousehold({
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 7,
      })}
      enabledCategories={new Set(['food', 'water-beverages'])}
      onComplete={onComplete}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('OnboardStep06Complete (v2)', () => {
  it('renders the completion title and provisioning summary', () => {
    renderStep();
    expect(
      screen.getByText('v2.onboarding.step06.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/v2\.onboarding\.step06\.setupComplete\.cockpit/),
    ).toBeInTheDocument();
  });

  it('renders the three KPI captions and key numbers', () => {
    renderStep();
    expect(screen.getByText('v2.voice.readiness.cockpit')).toBeInTheDocument();
    expect(
      screen.getByText('v2.onboarding.step06.categoriesCaption.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.onboarding.step06.daysCaption.cockpit'),
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // categories count
    expect(screen.getByText('7')).toBeInTheDocument(); // target days
  });

  it('clicking the CTA completes with the household and a seeded list', () => {
    const onComplete = vi.fn();
    renderStep(onComplete);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.step06.openDashboard.cockpit',
      }),
    );
    expect(onComplete).toHaveBeenCalled();
    const [household, items] = onComplete.mock.calls[0];
    expect(household.adults).toBe(2);
    // The picked categories arrive as items to acquire, so the new household
    // lands on a checklist rather than an empty inventory.
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i: { quantity: number }) => i.quantity === 0)).toBe(
      true,
    );
  });
});
