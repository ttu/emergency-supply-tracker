import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { CloudSyncContext } from './context';
import type {
  CloudProvider,
  CloudSyncState,
  CloudSyncConfig,
  SyncResult,
  CloudStorageProvider,
} from './types';
import { CloudSyncError, createDefaultCloudSyncState } from './types';
import {
  getProvider,
  initializeProviders,
  getTokensForProvider,
} from './services';
import { getAppData, saveAppData } from '@/shared/utils/storage/localStorage';

// Storage key for cloud sync config (separate from app data)
const CLOUD_SYNC_CONFIG_KEY = 'emergencySupplyTracker_cloudSyncConfig';

/**
 * Load cloud sync config from localStorage.
 */
function loadCloudSyncConfig(): CloudSyncConfig {
  try {
    const json = localStorage.getItem(CLOUD_SYNC_CONFIG_KEY);
    if (!json) {
      return {
        provider: null,
        lastSyncTimestamp: null,
        remoteFileId: null,
      };
    }
    return JSON.parse(json) as CloudSyncConfig;
  } catch {
    return {
      provider: null,
      lastSyncTimestamp: null,
      remoteFileId: null,
    };
  }
}

/**
 * Save cloud sync config to localStorage.
 */
function saveCloudSyncConfig(config: CloudSyncConfig): void {
  try {
    localStorage.setItem(CLOUD_SYNC_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save cloud sync config:', error);
  }
}

/**
 * Clear cloud sync config from localStorage.
 */
function clearCloudSyncConfig(): void {
  try {
    localStorage.removeItem(CLOUD_SYNC_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear cloud sync config:', error);
  }
}

/**
 * Create a success result with updated state.
 */
function createSuccessResult(
  direction: 'upload' | 'download' | 'none',
  timestamp: string,
  requiresReload?: boolean,
): SyncResult {
  return {
    success: true,
    direction,
    timestamp,
    ...(requiresReload && { requiresReload }),
  };
}

/**
 * Create an error result.
 */
function createErrorResult(error: string): SyncResult {
  return {
    success: false,
    direction: 'none',
    timestamp: new Date().toISOString(),
    error,
  };
}

/**
 * Extract error message from caught error.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof CloudSyncError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Sync failed';
}

/**
 * Get remote file metadata and modification time.
 * Returns { fileId, modifiedTime } or { fileId: null, modifiedTime: 0 } if not found.
 */
async function getRemoteFileInfo(
  provider: CloudStorageProvider,
  existingFileId: string | null,
): Promise<{ fileId: string | null; modifiedTime: number }> {
  let fileId = existingFileId;
  let modifiedTime = 0;

  // Check existing file
  if (fileId) {
    const metadata = await provider.getFileMetadata(fileId);
    if (metadata) {
      return {
        fileId,
        modifiedTime: new Date(metadata.modifiedTime).getTime(),
      };
    }
    // File was deleted remotely
    fileId = null;
  }

  // Try to find existing sync file
  if (!fileId) {
    fileId = await provider.findSyncFile();
    if (fileId) {
      const metadata = await provider.getFileMetadata(fileId);
      if (metadata) {
        modifiedTime = new Date(metadata.modifiedTime).getTime();
      }
    }
  }

  return { fileId, modifiedTime };
}

interface PerformSyncResult {
  syncResult: SyncResult;
  newFileId?: string;
}

/**
 * Perform the actual sync operation based on timestamps.
 * Uses last-write-wins strategy.
 */
async function performSync(
  provider: CloudStorageProvider,
  localData: ReturnType<typeof getAppData>,
  localModified: number,
  remoteFileId: string | null,
  remoteModified: number,
  timestamp: string,
  providerName: CloudProvider,
): Promise<PerformSyncResult> {
  // Upload: local is newer or no remote file
  if (!remoteFileId || localModified > remoteModified) {
    const dataJson = JSON.stringify(localData, null, 2);
    const newFileId = await provider.upload(
      dataJson,
      remoteFileId ?? undefined,
    );

    const newConfig: CloudSyncConfig = {
      provider: providerName,
      lastSyncTimestamp: timestamp,
      remoteFileId: newFileId,
    };
    saveCloudSyncConfig(newConfig);

    return {
      syncResult: createSuccessResult('upload', timestamp),
      newFileId,
    };
  }

  // Download: remote is newer
  if (remoteModified > localModified) {
    const remoteDataJson = await provider.download(remoteFileId);
    const remoteData = JSON.parse(remoteDataJson);
    saveAppData(remoteData);

    const newConfig: CloudSyncConfig = {
      provider: providerName,
      lastSyncTimestamp: timestamp,
      remoteFileId,
    };
    saveCloudSyncConfig(newConfig);

    return {
      syncResult: createSuccessResult('download', timestamp, true),
    };
  }

  // No changes needed
  const newConfig: CloudSyncConfig = {
    provider: providerName,
    lastSyncTimestamp: timestamp,
    remoteFileId,
  };
  saveCloudSyncConfig(newConfig);

  return {
    syncResult: createSuccessResult('none', timestamp),
  };
}

interface CloudSyncProviderProps {
  readonly children: ReactNode;
}

/**
 * Provider component for cloud sync functionality.
 * Manages connection state, sync operations, and error handling.
 */
export function CloudSyncProvider({ children }: CloudSyncProviderProps) {
  const [state, setState] = useState<CloudSyncState>(() => {
    const config = loadCloudSyncConfig();
    const tokens = config.provider
      ? getTokensForProvider(config.provider)
      : null;

    return {
      ...config,
      state: tokens ? 'connected' : 'disconnected',
      error: null,
    };
  });

  // Initialize providers on mount
  useEffect(() => {
    initializeProviders();
  }, []);

  /**
   * Connect to a cloud provider.
   */
  const connect = useCallback(async (providerId: CloudProvider) => {
    const provider = getProvider(providerId);
    if (!provider) {
      setState((prev) => ({
        ...prev,
        state: 'error',
        error: `Provider not available: ${providerId}`,
      }));
      return;
    }

    setState((prev) => ({ ...prev, state: 'syncing', error: null }));

    try {
      await provider.connect();

      const newConfig: CloudSyncConfig = {
        provider: providerId,
        lastSyncTimestamp: null,
        remoteFileId: null,
      };

      // Try to find existing sync file
      const existingFileId = await provider.findSyncFile();
      if (existingFileId) {
        newConfig.remoteFileId = existingFileId;
      }

      saveCloudSyncConfig(newConfig);

      setState({
        ...newConfig,
        state: 'connected',
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof CloudSyncError
          ? error.message
          : 'Failed to connect to cloud provider';

      setState((prev) => ({
        ...prev,
        state: 'error',
        error: message,
      }));
    }
  }, []);

  /**
   * Disconnect from current cloud provider.
   */
  const disconnect = useCallback(async () => {
    if (state.provider) {
      const provider = getProvider(state.provider);
      if (provider) {
        try {
          await provider.disconnect();
        } catch (error) {
          console.error('Error during disconnect:', error);
        }
      }
    }

    clearCloudSyncConfig();

    setState(createDefaultCloudSyncState());
  }, [state.provider]);

  /**
   * Perform sync operation (last-write-wins).
   */
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (!state.provider) {
      return createErrorResult('Not connected to a cloud provider');
    }

    const provider = getProvider(state.provider) as CloudStorageProvider;
    if (!provider?.isConnected()) {
      return createErrorResult('Not connected to cloud provider');
    }

    setState((prev) => ({ ...prev, state: 'syncing', error: null }));

    try {
      const localData = getAppData();
      if (!localData) {
        const errorMessage = 'No local data to sync';
        setState((prev) => ({
          ...prev,
          state: 'error',
          error: errorMessage,
        }));
        return createErrorResult(errorMessage);
      }

      const localModified = new Date(localData.lastModified).getTime();
      const { fileId: remoteFileId, modifiedTime: remoteModified } =
        await getRemoteFileInfo(provider, state.remoteFileId);

      const timestamp = new Date().toISOString();
      const result = await performSync(
        provider,
        localData,
        localModified,
        remoteFileId,
        remoteModified,
        timestamp,
        state.provider,
      );

      setState({
        provider: state.provider,
        lastSyncTimestamp: timestamp,
        remoteFileId: result.newFileId ?? remoteFileId,
        state: 'connected',
        error: null,
      });

      return result.syncResult;
    } catch (error) {
      const message = getErrorMessage(error);

      setState((prev) => ({
        ...prev,
        state: 'error',
        error: message,
      }));

      return createErrorResult(message);
    }
  }, [state.provider, state.remoteFileId]);

  /**
   * Clear current error state.
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      state: prev.provider ? 'connected' : 'disconnected',
      error: null,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      state,
      connect,
      disconnect,
      syncNow,
      clearError,
    }),
    [state, connect, disconnect, syncNow, clearError],
  );

  return (
    <CloudSyncContext.Provider value={contextValue}>
      {children}
    </CloudSyncContext.Provider>
  );
}
