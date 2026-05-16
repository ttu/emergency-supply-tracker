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
    expect(screen.getByText('PROVISIONING COMPLETE')).toBeInTheDocument();
    expect(screen.getByText(/SETUP COMPLETE · 05 \/ 05/)).toBeInTheDocument();
  });

  it('renders the three KPI captions and key numbers', () => {
    renderStep();
    expect(screen.getByText('READINESS')).toBeInTheDocument();
    expect(screen.getByText('CATEGORIES')).toBeInTheDocument();
    expect(screen.getByText('TARGET DAYS')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // categories count
    expect(screen.getByText('7')).toBeInTheDocument(); // target days
  });

  it('clicking the CTA calls onComplete with the household', () => {
    const onComplete = vi.fn();
    renderStep(onComplete);
    fireEvent.click(screen.getByRole('button', { name: /OPEN OVERVIEW →/ }));
    expect(onComplete).toHaveBeenCalled();
    const [household, items] = onComplete.mock.calls[0];
    expect(household.adults).toBe(2);
    expect(items).toEqual([]);
  });
});
