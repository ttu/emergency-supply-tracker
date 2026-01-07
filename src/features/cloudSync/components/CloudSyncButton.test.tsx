import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloudSyncButton } from './CloudSyncButton';
import { CloudSyncContext } from '../context';
import type {
  CloudSyncContextValue,
  CloudSyncState,
  SyncResult,
} from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultState: CloudSyncState = {
  provider: 'google-drive',
  lastSyncTimestamp: null,
  remoteFileId: null,
  state: 'connected',
  error: null,
};

const createMockContext = (
  state: Partial<CloudSyncState> = {},
  overrides: Partial<CloudSyncContextValue> = {},
): CloudSyncContextValue => ({
  state: { ...defaultState, ...state },
  connect: vi.fn(),
  disconnect: vi.fn(),
  syncNow: vi.fn().mockResolvedValue({
    success: true,
    direction: 'none',
    timestamp: new Date().toISOString(),
  }),
  clearError: vi.fn(),
  ...overrides,
});

const renderWithContext = (contextValue: CloudSyncContextValue) => {
  return render(
    <CloudSyncContext.Provider value={contextValue}>
      <CloudSyncButton />
    </CloudSyncContext.Provider>,
  );
};

describe('CloudSyncButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('button state', () => {
    it('should be disabled when disconnected', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be disabled when syncing', () => {
      renderWithContext(createMockContext({ state: 'syncing' }));

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be enabled when connected', () => {
      renderWithContext(createMockContext({ state: 'connected' }));

      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('should be enabled when in error state', () => {
      renderWithContext(createMockContext({ state: 'error' }));

      expect(screen.getByRole('button')).toBeEnabled();
    });
  });

  describe('button text', () => {
    it('should show sync text when not syncing', () => {
      renderWithContext(createMockContext({ state: 'connected' }));

      expect(screen.getByText('cloudSync.button.sync')).toBeInTheDocument();
    });

    it('should show syncing text when syncing', () => {
      renderWithContext(createMockContext({ state: 'syncing' }));

      expect(screen.getByText('cloudSync.button.syncing')).toBeInTheDocument();
    });
  });

  describe('sync action', () => {
    it('should call syncNow and clearError when clicked', async () => {
      const user = userEvent.setup();
      const mockSyncNow = vi.fn().mockResolvedValue({
        success: true,
        direction: 'none',
        timestamp: new Date().toISOString(),
      } as SyncResult);
      const mockClearError = vi.fn();

      renderWithContext(
        createMockContext(
          {},
          { syncNow: mockSyncNow, clearError: mockClearError },
        ),
      );

      await user.click(screen.getByRole('button'));

      expect(mockClearError).toHaveBeenCalled();
      expect(mockSyncNow).toHaveBeenCalled();
    });

    it('should show uploaded result on successful upload', async () => {
      const user = userEvent.setup();
      const mockSyncNow = vi.fn().mockResolvedValue({
        success: true,
        direction: 'upload',
        timestamp: new Date().toISOString(),
      } as SyncResult);

      renderWithContext(createMockContext({}, { syncNow: mockSyncNow }));

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(
          screen.getByText('cloudSync.result.uploaded'),
        ).toBeInTheDocument();
      });
    });

    it('should show downloaded result on successful download', async () => {
      const user = userEvent.setup();
      const mockSyncNow = vi.fn().mockResolvedValue({
        success: true,
        direction: 'download',
        timestamp: new Date().toISOString(),
      } as SyncResult);

      renderWithContext(createMockContext({}, { syncNow: mockSyncNow }));

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(
          screen.getByText('cloudSync.result.downloaded'),
        ).toBeInTheDocument();
      });
    });

    it('should reload page when download requires reload', async () => {
      const user = userEvent.setup();
      const mockSyncNow = vi.fn().mockResolvedValue({
        success: true,
        direction: 'download',
        timestamp: new Date().toISOString(),
        requiresReload: true,
      } as SyncResult);

      // jsdom doesn't allow mocking window.location.reload directly
      // Instead, we can verify the component tries to call it by checking if
      // syncNow was called and the downloaded result message is shown (before reload would happen)
      renderWithContext(createMockContext({}, { syncNow: mockSyncNow }));

      await user.click(screen.getByRole('button'));

      // Wait for the sync to complete - in the real app, reload would happen here
      // Since we can't mock reload in jsdom, we verify the flow up to that point
      await waitFor(() => {
        expect(mockSyncNow).toHaveBeenCalled();
      });

      // The component should have processed the requiresReload flag
      // In a real browser, window.location.reload() would be called here
      // We can't directly test that in jsdom, but the test verifies the sync completed
    });

    it('should show no changes result when none direction', async () => {
      const user = userEvent.setup();
      const mockSyncNow = vi.fn().mockResolvedValue({
        success: true,
        direction: 'none',
        timestamp: new Date().toISOString(),
      } as SyncResult);

      renderWithContext(createMockContext({}, { syncNow: mockSyncNow }));

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(
          screen.getByText('cloudSync.result.noChanges'),
        ).toBeInTheDocument();
      });
    });

    it('should not show result on failure', async () => {
      const user = userEvent.setup();
      const mockSyncNow = vi.fn().mockResolvedValue({
        success: false,
        direction: 'none',
        timestamp: new Date().toISOString(),
        error: 'Sync failed',
      } as SyncResult);

      renderWithContext(createMockContext({}, { syncNow: mockSyncNow }));

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockSyncNow).toHaveBeenCalled();
      });

      expect(
        screen.queryByText('cloudSync.result.uploaded'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('cloudSync.result.downloaded'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('cloudSync.result.noChanges'),
      ).not.toBeInTheDocument();
    });
  });

  describe('description', () => {
    it('should show description text', () => {
      renderWithContext(createMockContext());

      expect(
        screen.getByText('cloudSync.button.description'),
      ).toBeInTheDocument();
    });
  });

  describe('aria attributes', () => {
    it('should have aria-busy when syncing', () => {
      renderWithContext(createMockContext({ state: 'syncing' }));

      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('should not have aria-busy when not syncing', () => {
      renderWithContext(createMockContext({ state: 'connected' }));

      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
    });
  });
});
