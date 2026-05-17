import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Alerts } from './Alerts';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('Alerts (v2)', () => {
  const setup = () =>
    renderWithProviders(
      <Alerts onItemSelect={vi.fn()} onCategorySelect={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [],
        }),
      },
    );

  it('renders the ALERTS · LOG title in cockpit voice', () => {
    setup();
    expect(screen.getByText('ALERTS · LOG')).toBeInTheDocument();
  });

  it('renders three count panels (CRITICAL / WARN / OK or INFO)', () => {
    setup();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('WARN')).toBeInTheDocument();
    expect(screen.getByText('INFO')).toBeInTheDocument();
  });
});
