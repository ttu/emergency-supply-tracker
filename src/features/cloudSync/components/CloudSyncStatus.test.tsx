import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CloudSyncStatus } from './CloudSyncStatus';
import { CloudSyncContext } from '../context';
import type { CloudSyncContextValue, CloudSyncState } from '../types';

const mockTranslation = vi.fn((key: string, params?: object) => {
  if (params) {
    return `${key} ${JSON.stringify(params)}`;
  }
  return key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockTranslation,
    i18n: { language: 'en' },
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
): CloudSyncContextValue => ({
  state: { ...defaultState, ...state },
  connect: vi.fn(),
  disconnect: vi.fn(),
  syncNow: vi.fn(),
  clearError: vi.fn(),
});

const renderWithContext = (
  contextValue: CloudSyncContextValue = createMockContext(),
) => {
  return render(
    <CloudSyncContext.Provider value={contextValue}>
      <CloudSyncStatus />
    </CloudSyncContext.Provider>,
  );
};

describe('CloudSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('status text', () => {
    it('should show disconnected status', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(
        screen.getByText('cloudSync.status.disconnected'),
      ).toBeInTheDocument();
    });

    it('should show connected status', () => {
      renderWithContext(createMockContext({ state: 'connected' }));

      expect(
        screen.getByText('cloudSync.status.connected'),
      ).toBeInTheDocument();
    });

    it('should show syncing status', () => {
      renderWithContext(createMockContext({ state: 'syncing' }));

      expect(screen.getByText('cloudSync.status.syncing')).toBeInTheDocument();
    });

    it('should show error status', () => {
      renderWithContext(createMockContext({ state: 'error' }));

      expect(screen.getByText('cloudSync.status.error')).toBeInTheDocument();
    });
  });

  describe('provider display', () => {
    it('should not show provider when not set', () => {
      renderWithContext(createMockContext({ provider: null }));

      expect(
        screen.queryByText(/cloudSync\.providers\./),
      ).not.toBeInTheDocument();
    });

    it('should show provider name when connected', () => {
      renderWithContext(
        createMockContext({ state: 'connected', provider: 'google-drive' }),
      );

      expect(
        screen.getByText('(cloudSync.providers.google-drive)'),
      ).toBeInTheDocument();
    });
  });

  describe('last sync display', () => {
    it('should not show last sync when disconnected', () => {
      renderWithContext(createMockContext({ state: 'disconnected' }));

      expect(
        screen.queryByText(/cloudSync\.status\.lastSync/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/cloudSync\.status\.neverSynced/),
      ).not.toBeInTheDocument();
    });

    it('should show never synced when connected with no timestamp', () => {
      renderWithContext(
        createMockContext({ state: 'connected', lastSyncTimestamp: null }),
      );

      expect(
        screen.getByText('cloudSync.status.neverSynced'),
      ).toBeInTheDocument();
    });

    it('should show last sync time when available', () => {
      const timestamp = '2024-01-15T10:30:00Z';
      renderWithContext(
        createMockContext({
          state: 'connected',
          lastSyncTimestamp: timestamp,
        }),
      );

      // The translation mock returns the key with params
      expect(mockTranslation).toHaveBeenCalledWith(
        'cloudSync.status.lastSync',
        {
          date: expect.any(String),
          time: expect.any(String),
        },
      );
    });
  });

  describe('error display', () => {
    it('should not show error when none exists', () => {
      renderWithContext(createMockContext({ error: null }));

      // Error message element should not exist
      const errorElements = document.querySelectorAll(
        '[class*="errorMessage"]',
      );
      expect(errorElements.length).toBe(0);
    });

    it('should show error message when error exists', () => {
      const errorMessage = 'Connection failed';
      renderWithContext(
        createMockContext({ state: 'error', error: errorMessage }),
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
