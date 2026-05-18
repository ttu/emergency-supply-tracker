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

  it('renders the alerts title key in cockpit theme', () => {
    setup();
    expect(screen.getByText('v2.alerts.title.cockpit')).toBeInTheDocument();
  });

  it('renders three count panel captions (critical / warning / info)', () => {
    setup();
    expect(screen.getByText('v2.voice.critical.cockpit')).toBeInTheDocument();
    expect(screen.getByText('v2.voice.warning.cockpit')).toBeInTheDocument();
    expect(screen.getByText('v2.alerts.info.cockpit')).toBeInTheDocument();
  });
});
