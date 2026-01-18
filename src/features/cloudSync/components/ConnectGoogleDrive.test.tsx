import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectGoogleDrive } from './ConnectGoogleDrive';
import { CloudSyncContext } from '../context';
import type { CloudSyncContextValue, CloudSyncState } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultState: CloudSyncState = {
  provider: null,
  lastSyncTimestamp: null,
  remoteFileId: null,
  state: 'disconnected',
  error: null,
};

const createMockContext = (
  state: Partial<CloudSyncState> = {},
  overrides: Partial<CloudSyncContextValue> = {},
): CloudSyncContextValue => ({
  state: { ...defaultState, ...state },
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  syncNow: vi.fn(),
  clearError: vi.fn(),
  ...overrides,
});

const renderWithContext = (contextValue: CloudSyncContextValue) => {
  return render(
    <CloudSyncContext.Provider value={contextValue}>
      <ConnectGoogleDrive />
    </CloudSyncContext.Provider>,
  );
};

describe('ConnectGoogleDrive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when disconnected', () => {
    it('should show connect button', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(screen.getByText('cloudSync.google.connect')).toBeInTheDocument();
    });

    it('should show description', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(
        screen.getByText('cloudSync.google.description'),
      ).toBeInTheDocument();
    });

    it('should call connect when clicked', async () => {
      const user = userEvent.setup();
      const mockConnect = vi.fn().mockResolvedValue(undefined);

      renderWithContext(createMockContext({}, { connect: mockConnect }));

      await user.click(screen.getByText('cloudSync.google.connect'));

      expect(mockConnect).toHaveBeenCalledWith('google-drive');
    });

    it('should show connecting text during connection', async () => {
      const user = userEvent.setup();
      let resolveConnect: () => void;
      const connectPromise = new Promise<void>((resolve) => {
        resolveConnect = resolve;
      });
      const mockConnect = vi.fn().mockReturnValue(connectPromise);

      renderWithContext(createMockContext({}, { connect: mockConnect }));

      await user.click(screen.getByText('cloudSync.google.connect'));

      expect(
        screen.getByText('cloudSync.google.connecting'),
      ).toBeInTheDocument();

      resolveConnect!();
      await waitFor(() => {
        expect(
          screen.queryByText('cloudSync.google.connecting'),
        ).not.toBeInTheDocument();
      });
    });

    it('should disable button during connection', async () => {
      const user = userEvent.setup();
      let resolveConnect: () => void;
      const connectPromise = new Promise<void>((resolve) => {
        resolveConnect = resolve;
      });
      const mockConnect = vi.fn().mockReturnValue(connectPromise);

      renderWithContext(createMockContext({}, { connect: mockConnect }));

      await user.click(screen.getByText('cloudSync.google.connect'));

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeDisabled();

      resolveConnect!();
      await waitFor(() => {
        expect(buttons[0]).toBeEnabled();
      });
    });
  });

  describe('when connected', () => {
    it('should show connected info', () => {
      renderWithContext(
        createMockContext({ state: 'connected', provider: 'google-drive' }),
      );

      expect(
        screen.getByText('cloudSync.google.connected'),
      ).toBeInTheDocument();
    });

    it('should show disconnect button', () => {
      renderWithContext(
        createMockContext({ state: 'connected', provider: 'google-drive' }),
      );

      expect(
        screen.getByText('cloudSync.disconnect.button'),
      ).toBeInTheDocument();
    });

    it('should show confirmation dialog on disconnect', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi
        .spyOn(globalThis, 'confirm')
        .mockReturnValue(false);

      renderWithContext(
        createMockContext({ state: 'connected', provider: 'google-drive' }),
      );

      await user.click(screen.getByText('cloudSync.disconnect.button'));

      expect(mockConfirm).toHaveBeenCalledWith('cloudSync.disconnect.confirm');

      mockConfirm.mockRestore();
    });

    it('should call disconnect when confirmed', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
      const mockDisconnect = vi.fn().mockResolvedValue(undefined);

      renderWithContext(
        createMockContext(
          { state: 'connected', provider: 'google-drive' },
          { disconnect: mockDisconnect },
        ),
      );

      await user.click(screen.getByText('cloudSync.disconnect.button'));

      expect(mockDisconnect).toHaveBeenCalled();

      mockConfirm.mockRestore();
    });

    it('should not call disconnect when cancelled', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi
        .spyOn(globalThis, 'confirm')
        .mockReturnValue(false);
      const mockDisconnect = vi.fn().mockResolvedValue(undefined);

      renderWithContext(
        createMockContext(
          { state: 'connected', provider: 'google-drive' },
          { disconnect: mockDisconnect },
        ),
      );

      await user.click(screen.getByText('cloudSync.disconnect.button'));

      expect(mockDisconnect).not.toHaveBeenCalled();

      mockConfirm.mockRestore();
    });

    it('should show disconnecting text during disconnect', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
      let resolveDisconnect: () => void;
      const disconnectPromise = new Promise<void>((resolve) => {
        resolveDisconnect = resolve;
      });
      const mockDisconnect = vi.fn().mockReturnValue(disconnectPromise);

      renderWithContext(
        createMockContext(
          { state: 'connected', provider: 'google-drive' },
          { disconnect: mockDisconnect },
        ),
      );

      await user.click(screen.getByText('cloudSync.disconnect.button'));

      expect(
        screen.getByText('cloudSync.disconnect.disconnecting'),
      ).toBeInTheDocument();

      resolveDisconnect!();
      await waitFor(() => {
        expect(
          screen.queryByText('cloudSync.disconnect.disconnecting'),
        ).not.toBeInTheDocument();
      });

      mockConfirm.mockRestore();
    });

    it('should disable disconnect button while syncing', () => {
      renderWithContext(
        createMockContext({ state: 'syncing', provider: 'google-drive' }),
      );

      expect(screen.getByText('cloudSync.disconnect.button')).toBeDisabled();
    });
  });

  describe('when in error state with provider', () => {
    it('should show as connected if provider is google-drive', () => {
      renderWithContext(
        createMockContext({
          state: 'error',
          provider: 'google-drive',
          error: 'Some error',
        }),
      );

      expect(
        screen.getByText('cloudSync.google.connected'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('cloudSync.disconnect.button'),
      ).toBeInTheDocument();
    });
  });

  describe('syncing state', () => {
    it('should show as connected when syncing', () => {
      renderWithContext(
        createMockContext({ state: 'syncing', provider: 'google-drive' }),
      );

      expect(
        screen.getByText('cloudSync.google.connected'),
      ).toBeInTheDocument();
    });
  });
});
