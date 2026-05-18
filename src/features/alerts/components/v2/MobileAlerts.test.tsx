import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MobileAlerts } from './MobileAlerts';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('MobileAlerts (v2)', () => {
  it('renders the three alert-count captions in cockpit theme', () => {
    renderWithProviders(
      <MobileAlerts onItemSelect={vi.fn()} onCategorySelect={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [],
        }),
      },
    );
    expect(screen.getByText('v2.voice.critical.cockpit')).toBeInTheDocument();
    expect(screen.getByText('v2.voice.warning.cockpit')).toBeInTheDocument();
  });
});
