import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloudSyncButton } from './CloudSyncButton';
import { CloudSyncContext } from '../context';
import type {
  CloudSyncContextValue,
  CloudSyncState,
  SyncResult,
} from '../types';

jest.mock('react-i18next', () => ({
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
  connect: jest.fn(),
  disconnect: jest.fn(),
  syncNow: jest.fn().mockResolvedValue({
    success: true,
    direction: 'none',
    timestamp: new Date().toISOString(),
  }),
  clearError: jest.fn(),
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
    jest.clearAllMocks();
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
      const mockSyncNow = jest.fn().mockResolvedValue({
        success: true,
        direction: 'none',
        timestamp: new Date().toISOString(),
      } as SyncResult);
      const mockClearError = jest.fn();

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
      const mockSyncNow = jest.fn().mockResolvedValue({
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
      const mockSyncNow = jest.fn().mockResolvedValue({
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

    it('should show no changes result when none direction', async () => {
      const user = userEvent.setup();
      const mockSyncNow = jest.fn().mockResolvedValue({
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
      const mockSyncNow = jest.fn().mockResolvedValue({
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
