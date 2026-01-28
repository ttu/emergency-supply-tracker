import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloudSyncProvider } from './provider';
import { useCloudSync } from './hooks';
import * as cloudStorageProvider from './__mocks__/services/cloudStorageProvider';
import * as localStorage from '@/shared/utils/storage/localStorage';
import type { CloudStorageProvider as ICloudStorageProvider } from './types';
import type { Mock } from 'vitest';

// Mock localStorage functions
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
}));
const mockLocalStorage = localStorage as unknown as {
  getAppData: Mock;
  saveAppData: Mock;
};

// Mock cloudSync services to use the mock implementations
vi.mock('./services', async () => {
  const mockServices = await vi.importActual('./__mocks__/services');
  return mockServices;
});

// Test component that exposes the hook
function TestConsumer({
  onStateChange,
}: {
  onStateChange?: (state: ReturnType<typeof useCloudSync>) => void;
}) {
  const cloudSync = useCloudSync();
  onStateChange?.(cloudSync);

  return (
    <div>
      <div data-testid="state">{cloudSync.state.state}</div>
      <div data-testid="provider">{cloudSync.state.provider ?? 'none'}</div>
      <div data-testid="error">{cloudSync.state.error ?? 'none'}</div>
      <button onClick={() => cloudSync.connect('google-drive')}>Connect</button>
      <button onClick={() => cloudSync.disconnect()}>Disconnect</button>
      <button onClick={() => cloudSync.syncNow()}>Sync</button>
      <button onClick={() => cloudSync.clearError()}>Clear Error</button>
    </div>
  );
}

describe('CloudSyncProvider', () => {
  // Create mock provider with vi.fn() for each method
  const createMockProvider = (): ICloudStorageProvider => ({
    providerId: 'google-drive' as const,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    getAccessToken: vi.fn().mockResolvedValue('token'),
    upload: vi.fn().mockResolvedValue('file-id'),
    download: vi.fn().mockResolvedValue('{}'),
    getFileMetadata: vi.fn().mockResolvedValue(null),
    findSyncFile: vi.fn().mockResolvedValue(null),
  });

  let mockProvider: ICloudStorageProvider;
  let initializeProvidersSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    globalThis.localStorage.clear();
    cloudStorageProvider.resetProviders();

    // Create fresh mock provider for each test
    mockProvider = createMockProvider();
    // Return the SAME instance every time getProvider is called
    cloudStorageProvider.registerProvider('google-drive', () => mockProvider);
    mockLocalStorage.getAppData.mockReturnValue(null);

    // Spy on initializeProviders and make it a no-op since we register our own provider
    initializeProvidersSpy = vi
      .spyOn(cloudStorageProvider, 'initializeProviders')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original initializeProviders
    initializeProvidersSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <CloudSyncProvider>
        <div>Child content</div>
      </CloudSyncProvider>,
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should initialize with disconnected state', () => {
    render(
      <CloudSyncProvider>
        <TestConsumer />
      </CloudSyncProvider>,
    );

    expect(screen.getByTestId('state')).toHaveTextContent('disconnected');
    expect(screen.getByTestId('provider')).toHaveTextContent('none');
  });

  it('should restore connected state from config if tokens exist', () => {
    // Store config in localStorage
    const config = {
      provider: 'google-drive',
      lastSyncTimestamp: '2024-01-01T00:00:00Z',
      remoteFileId: 'file-123',
    };
    globalThis.localStorage.setItem(
      'emergencySupplyTracker_cloudSyncConfig',
      JSON.stringify(config),
    );

    // Store tokens
    const tokens = {
      accessToken: 'token',
      refreshToken: null,
      expiresAt: Date.now() + 3600000,
      provider: 'google-drive',
    };
    globalThis.localStorage.setItem(
      'emergencySupplyTracker_cloudTokens',
      JSON.stringify(tokens),
    );

    render(
      <CloudSyncProvider>
        <TestConsumer />
      </CloudSyncProvider>,
    );

    expect(screen.getByTestId('state')).toHaveTextContent('connected');
    expect(screen.getByTestId('provider')).toHaveTextContent('google-drive');
  });

  it('should handle invalid JSON in config gracefully', () => {
    // Store invalid JSON
    globalThis.localStorage.setItem(
      'emergencySupplyTracker_cloudSyncConfig',
      'invalid json{',
    );

    render(
      <CloudSyncProvider>
        <TestConsumer />
      </CloudSyncProvider>,
    );

    // Should fall back to disconnected state
    expect(screen.getByTestId('state')).toHaveTextContent('disconnected');
    expect(screen.getByTestId('provider')).toHaveTextContent('none');
  });

  describe('connect', () => {
    it('should connect to provider successfully', async () => {
      const user = userEvent.setup();

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));

      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });
      expect(screen.getByTestId('provider')).toHaveTextContent('google-drive');
    });

    it('should find existing sync file on connect', async () => {
      const user = userEvent.setup();
      (mockProvider.findSyncFile as Mock).mockResolvedValue('existing-file-id');

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));

      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      // Check that config was saved with file ID
      const savedConfig = JSON.parse(
        globalThis.localStorage.getItem(
          'emergencySupplyTracker_cloudSyncConfig',
        ) ?? '{}',
      );
      expect(savedConfig.remoteFileId).toBe('existing-file-id');
    });

    it('should handle provider not available', async () => {
      const user = userEvent.setup();
      cloudStorageProvider.resetProviders(); // No providers registered

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));

      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('error');
      });
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Provider not available',
      );
    });

    it('should handle connection error', async () => {
      const user = userEvent.setup();
      (mockProvider.connect as Mock).mockRejectedValue(
        new Error('Connection failed'),
      );

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));

      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('error');
      });
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Failed to connect',
      );
    });

    it('should handle CloudSyncError with specific message', async () => {
      const user = userEvent.setup();
      const { CloudSyncError } = (await vi.importActual('./types')) as {
        CloudSyncError: new (
          message: string,
          code: string,
          isRetryable?: boolean,
        ) => Error;
      };
      (mockProvider.connect as Mock).mockRejectedValue(
        new CloudSyncError('User cancelled', 'AUTH_CANCELLED'),
      );

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('User cancelled');
      });
    });
  });

  describe('disconnect', () => {
    it('should disconnect from provider', async () => {
      const user = userEvent.setup();

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      // First connect
      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      // Then disconnect
      await user.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('disconnected');
      });
      expect(screen.getByTestId('provider')).toHaveTextContent('none');
    });

    it('should handle disconnect error gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (mockProvider.disconnect as Mock).mockRejectedValue(
        new Error('Disconnect failed'),
      );

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      await user.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('disconnected');
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('syncNow', () => {
    it('should return error when not connected', async () => {
      render(
        <CloudSyncProvider>
          <TestConsumer
            onStateChange={(cs) => {
              (globalThis as unknown as Record<string, unknown>).testSyncNow =
                cs.syncNow;
            }}
          />
        </CloudSyncProvider>,
      );

      const syncResult = await (
        globalThis as unknown as { testSyncNow: () => Promise<unknown> }
      ).testSyncNow();

      expect(syncResult).toEqual(
        expect.objectContaining({
          success: false,
          error: 'Not connected to a cloud provider',
        }),
      );
    });

    it('should return error result when no local data without changing state', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getAppData.mockReturnValue(null);

      let capturedSyncNow: (() => Promise<unknown>) | null = null;

      render(
        <CloudSyncProvider>
          <TestConsumer
            onStateChange={(cs) => {
              capturedSyncNow = cs.syncNow;
            }}
          />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      // Sync with no data - should return error result but not change state
      const result = await capturedSyncNow!();
      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          error: 'No local data to sync',
        }),
      );

      // State should stay connected (not changed to error)
      expect(screen.getByTestId('state')).toHaveTextContent('connected');
    });

    it('should upload when local is newer', async () => {
      const user = userEvent.setup();
      const localData = {
        lastModified: new Date().toISOString(),
        items: [],
      };
      mockLocalStorage.getAppData.mockReturnValue(localData);

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      await user.click(screen.getByText('Sync'));

      await waitFor(() => {
        expect(mockProvider.upload).toHaveBeenCalled();
      });
    });

    it('should download when remote is newer', async () => {
      const user = userEvent.setup();
      const oldDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const newDate = new Date().toISOString();

      const localData = {
        lastModified: oldDate,
        items: [],
      };
      const remoteData = {
        lastModified: newDate,
        items: [{ id: 'remote-item' }],
      };

      mockLocalStorage.getAppData.mockReturnValue(localData);
      (mockProvider.findSyncFile as Mock).mockResolvedValue('remote-file-id');
      (mockProvider.getFileMetadata as Mock).mockResolvedValue({
        id: 'remote-file-id',
        name: 'test.json',
        modifiedTime: newDate,
      });
      (mockProvider.download as Mock).mockResolvedValue(
        JSON.stringify(remoteData),
      );

      // Spy on console.error to suppress jsdom "not implemented" error for location.reload
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      await user.click(screen.getByText('Sync'));

      // Verify download was called and data was saved
      // Note: window.location.reload() is called but jsdom doesn't implement it
      await waitFor(() => {
        expect(mockProvider.download).toHaveBeenCalledWith('remote-file-id');
        expect(mockLocalStorage.saveAppData).toHaveBeenCalledWith(remoteData);
      });

      consoleSpy.mockRestore();
    });

    it('should handle sync error', async () => {
      const user = userEvent.setup();
      const localData = {
        lastModified: new Date().toISOString(),
        items: [],
      };
      mockLocalStorage.getAppData.mockReturnValue(localData);
      (mockProvider.upload as Mock).mockRejectedValue(
        new Error('Upload failed'),
      );

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      await user.click(screen.getByText('Sync'));

      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('error');
        expect(screen.getByTestId('error')).toHaveTextContent('Upload failed');
      });
    });

    it('should handle no changes needed', async () => {
      const user = userEvent.setup();
      const sameDate = new Date().toISOString();

      const localData = {
        lastModified: sameDate,
        items: [],
      };

      mockLocalStorage.getAppData.mockReturnValue(localData);
      (mockProvider.findSyncFile as Mock).mockResolvedValue('remote-file-id');
      (mockProvider.getFileMetadata as Mock).mockResolvedValue({
        id: 'remote-file-id',
        name: 'test.json',
        modifiedTime: sameDate,
      });

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      await user.click(screen.getByText('Sync'));

      await waitFor(() => {
        expect(mockProvider.upload).not.toHaveBeenCalled();
        expect(mockProvider.download).not.toHaveBeenCalled();
      });
    });

    it('should handle remote file deleted', async () => {
      const user = userEvent.setup();
      const localData = {
        lastModified: new Date().toISOString(),
        items: [],
      };

      mockLocalStorage.getAppData.mockReturnValue(localData);

      // Store config with file ID that will be deleted
      globalThis.localStorage.setItem(
        'emergencySupplyTracker_cloudSyncConfig',
        JSON.stringify({
          provider: 'google-drive',
          lastSyncTimestamp: null,
          remoteFileId: 'old-file-id',
        }),
      );

      // Store tokens to appear connected
      globalThis.localStorage.setItem(
        'emergencySupplyTracker_cloudTokens',
        JSON.stringify({
          accessToken: 'token',
          refreshToken: null,
          expiresAt: Date.now() + 3600000,
          provider: 'google-drive',
        }),
      );

      // File metadata returns null (deleted)
      (mockProvider.getFileMetadata as Mock).mockResolvedValue(null);
      // Find sync file also returns null
      (mockProvider.findSyncFile as Mock).mockResolvedValue(null);

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      // Should be connected from stored config
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      await user.click(screen.getByText('Sync'));

      await waitFor(() => {
        expect(mockProvider.upload).toHaveBeenCalled();
      });
    });

    it('should find and use remote file when no initial remoteFileId', async () => {
      const user = userEvent.setup();
      const oldDate = new Date(Date.now() - 3600000).toISOString();
      const newDate = new Date().toISOString();

      const localData = {
        lastModified: oldDate,
        items: [],
      };
      const remoteData = {
        lastModified: newDate,
        items: [{ id: 'from-remote' }],
      };

      mockLocalStorage.getAppData.mockReturnValue(localData);

      // No initial remoteFileId but findSyncFile returns one
      (mockProvider.findSyncFile as Mock).mockResolvedValue('found-file-id');
      (mockProvider.getFileMetadata as Mock).mockResolvedValue({
        id: 'found-file-id',
        name: 'test.json',
        modifiedTime: newDate,
      });
      (mockProvider.download as Mock).mockResolvedValue(
        JSON.stringify(remoteData),
      );

      // Spy on console.error to suppress jsdom "not implemented" error for location.reload
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      await user.click(screen.getByText('Sync'));

      // Should have found and downloaded from the remote file
      await waitFor(() => {
        expect(mockProvider.findSyncFile).toHaveBeenCalled();
        expect(mockProvider.getFileMetadata).toHaveBeenCalledWith(
          'found-file-id',
        );
        expect(mockProvider.download).toHaveBeenCalledWith('found-file-id');
        expect(mockLocalStorage.saveAppData).toHaveBeenCalledWith(remoteData);
      });

      consoleSpy.mockRestore();
    });

    it('should return error when provider is not connected', async () => {
      const user = userEvent.setup();
      (mockProvider.isConnected as Mock).mockReturnValue(false);

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      // Now provider reports disconnected
      await user.click(screen.getByText('Sync'));

      // Should handle gracefully - state remains connected
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });
    });
  });

  describe('clearError', () => {
    it('should clear error and restore to disconnected state', async () => {
      const user = userEvent.setup();
      // Make connect reject to trigger an error
      (mockProvider.connect as Mock).mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      // Trigger an error
      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('error');
      });

      // Clear the error
      await user.click(screen.getByText('Clear Error'));

      expect(screen.getByTestId('state')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('should restore connected state when provider exists', async () => {
      const user = userEvent.setup();
      const localData = {
        lastModified: new Date().toISOString(),
        items: [],
      };
      mockLocalStorage.getAppData.mockReturnValue(localData);

      render(
        <CloudSyncProvider>
          <TestConsumer />
        </CloudSyncProvider>,
      );

      // Connect first
      await user.click(screen.getByText('Connect'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('connected');
      });

      // Now set upload to fail for next call
      (mockProvider.upload as Mock).mockRejectedValueOnce(
        new Error('Upload failed'),
      );

      // Trigger sync error
      await user.click(screen.getByText('Sync'));
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('error');
      });

      // Clear the error
      await user.click(screen.getByText('Clear Error'));

      expect(screen.getByTestId('state')).toHaveTextContent('connected');
    });
  });
});
