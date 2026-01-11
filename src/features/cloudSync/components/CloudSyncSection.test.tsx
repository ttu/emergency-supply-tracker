import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CloudSyncSection } from './CloudSyncSection';
import { CloudSyncContext } from '../context';
import type { CloudSyncContextValue, CloudSyncState } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock child components to simplify testing
vi.mock('./CloudSyncStatus', () => ({
  CloudSyncStatus: () => <div data-testid="cloud-sync-status">Status</div>,
}));

vi.mock('./CloudSyncButton', () => ({
  CloudSyncButton: () => <div data-testid="cloud-sync-button">Button</div>,
}));

vi.mock('./ConnectGoogleDrive', () => ({
  ConnectGoogleDrive: () => (
    <div data-testid="connect-google-drive">Connect</div>
  ),
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
): CloudSyncContextValue => ({
  state: { ...defaultState, ...state },
  connect: vi.fn(),
  disconnect: vi.fn(),
  syncNow: vi.fn(),
  clearError: vi.fn(),
});

const renderWithContext = (contextValue: CloudSyncContextValue) => {
  return render(
    <CloudSyncContext.Provider value={contextValue}>
      <CloudSyncSection />
    </CloudSyncContext.Provider>,
  );
};

describe('CloudSyncSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should always render CloudSyncStatus', () => {
    renderWithContext(createMockContext());

    expect(screen.getByTestId('cloud-sync-status')).toBeInTheDocument();
  });

  describe('when disconnected', () => {
    it('should show connect title', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(
        screen.getByText('cloudSync.section.connectTitle'),
      ).toBeInTheDocument();
    });

    it('should show ConnectGoogleDrive component', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(screen.getByTestId('connect-google-drive')).toBeInTheDocument();
    });

    it('should not show CloudSyncButton', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(screen.queryByTestId('cloud-sync-button')).not.toBeInTheDocument();
    });

    it('should not show account section', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(
        screen.queryByText('cloudSync.section.accountTitle'),
      ).not.toBeInTheDocument();
    });
  });

  describe('when connected', () => {
    it('should show sync title', () => {
      renderWithContext(
        createMockContext({ state: 'connected', provider: 'google-drive' }),
      );

      expect(
        screen.getByText('cloudSync.section.syncTitle'),
      ).toBeInTheDocument();
    });

    it('should show CloudSyncButton', () => {
      renderWithContext(
        createMockContext({ state: 'connected', provider: 'google-drive' }),
      );

      expect(screen.getByTestId('cloud-sync-button')).toBeInTheDocument();
    });

    it('should show account section with title', () => {
      renderWithContext(
        createMockContext({ state: 'connected', provider: 'google-drive' }),
      );

      expect(
        screen.getByText('cloudSync.section.accountTitle'),
      ).toBeInTheDocument();
    });

    it('should show ConnectGoogleDrive in account section only', () => {
      renderWithContext(
        createMockContext({ state: 'connected', provider: 'google-drive' }),
      );

      // When connected, ConnectGoogleDrive only appears in the account section
      // (the main action shows CloudSyncButton instead)
      const connectComponents = screen.getAllByTestId('connect-google-drive');
      expect(connectComponents).toHaveLength(1);
    });
  });

  describe('when syncing', () => {
    it('should show sync title', () => {
      renderWithContext(
        createMockContext({ state: 'syncing', provider: 'google-drive' }),
      );

      expect(
        screen.getByText('cloudSync.section.syncTitle'),
      ).toBeInTheDocument();
    });

    it('should show CloudSyncButton and account section', () => {
      renderWithContext(
        createMockContext({ state: 'syncing', provider: 'google-drive' }),
      );

      expect(screen.getByTestId('cloud-sync-button')).toBeInTheDocument();
      expect(
        screen.getByText('cloudSync.section.accountTitle'),
      ).toBeInTheDocument();
    });
  });

  describe('when error with provider', () => {
    it('should show sync title when provider is set', () => {
      renderWithContext(
        createMockContext({
          state: 'error',
          provider: 'google-drive',
          error: 'Some error',
        }),
      );

      expect(
        screen.getByText('cloudSync.section.syncTitle'),
      ).toBeInTheDocument();
    });

    it('should show CloudSyncButton and account section', () => {
      renderWithContext(
        createMockContext({
          state: 'error',
          provider: 'google-drive',
          error: 'Some error',
        }),
      );

      expect(screen.getByTestId('cloud-sync-button')).toBeInTheDocument();
      expect(
        screen.getByText('cloudSync.section.accountTitle'),
      ).toBeInTheDocument();
    });
  });

  describe('when error without provider', () => {
    it('should show connect title', () => {
      renderWithContext(
        createMockContext({
          state: 'error',
          provider: null,
          error: 'Some error',
        }),
      );

      expect(
        screen.getByText('cloudSync.section.connectTitle'),
      ).toBeInTheDocument();
    });

    it('should not show account section', () => {
      renderWithContext(
        createMockContext({
          state: 'error',
          provider: null,
          error: 'Some error',
        }),
      );

      expect(
        screen.queryByText('cloudSync.section.accountTitle'),
      ).not.toBeInTheDocument();
    });
  });
});
