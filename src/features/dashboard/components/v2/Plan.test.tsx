import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Plan } from './Plan';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

describe('Plan (v2)', () => {
  const setup = () =>
    renderWithProviders(<Plan />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });

  it('renders preparedness goal rows with their G-codes', () => {
    setup();
    expect(screen.getByText('G-01')).toBeInTheDocument();
    expect(screen.getByText('G-02')).toBeInTheDocument();
    expect(screen.getByText('G-05')).toBeInTheDocument();
  });

  it('renders the goal titles in cockpit theme', () => {
    setup();
    expect(screen.getByText('v2.plan.goals.g01.cockpit')).toBeInTheDocument();
    expect(screen.getByText('v2.plan.goals.g02.cockpit')).toBeInTheDocument();
    expect(screen.getByText('v2.plan.goals.g03.cockpit')).toBeInTheDocument();
  });
});
