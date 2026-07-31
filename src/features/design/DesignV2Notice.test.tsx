import { describe, it, expect } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { DesignV2Notice } from './DesignV2Notice';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { getAppData } from '@/shared/utils/storage/localStorage';

const setup = (settings: Partial<ReturnType<typeof createMockSettings>>) =>
  renderWithProviders(<DesignV2Notice />, {
    initialAppData: createMockAppData({
      settings: createMockSettings(settings),
    }),
  });

const noticeTitle = () => screen.queryByText('settings.designV2Notice.title');

describe('DesignV2Notice', () => {
  it('invites v1 users to try the new design', () => {
    setup({ theme: 'light', designV2NoticeDismissed: false });
    expect(noticeTitle()).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('stays hidden once dismissed', () => {
    setup({ theme: 'light', designV2NoticeDismissed: true });
    expect(noticeTitle()).not.toBeInTheDocument();
  });

  it('stays hidden when a v2 theme is already active', () => {
    setup({ theme: 'cockpit', designV2NoticeDismissed: false });
    expect(noticeTitle()).not.toBeInTheDocument();
  });

  it('"try it" switches to cockpit and does not come back', async () => {
    setup({ theme: 'light', designV2NoticeDismissed: false });

    fireEvent.click(
      screen.getByRole('button', { name: 'settings.designV2Notice.tryAction' }),
    );

    await waitFor(() => expect(noticeTitle()).not.toBeInTheDocument());
    const stored = getAppData();
    expect(stored?.settings.theme).toBe('cockpit');
    expect(stored?.settings.designV2NoticeDismissed).toBe(true);
  });

  it('"maybe later" dismisses without changing the theme', async () => {
    setup({ theme: 'light', designV2NoticeDismissed: false });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'settings.designV2Notice.dismissAction',
      }),
    );

    await waitFor(() => expect(noticeTitle()).not.toBeInTheDocument());
    const stored = getAppData();
    expect(stored?.settings.theme).toBe('light');
    expect(stored?.settings.designV2NoticeDismissed).toBe(true);
  });
});
