import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MobileDashboard } from './MobileDashboard';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('MobileDashboard (v2)', () => {
  it('renders the READINESS KPI under cockpit voice', () => {
    renderWithProviders(<MobileDashboard onCategorySelect={vi.fn()} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('READINESS')).toBeInTheDocument();
  });
});
