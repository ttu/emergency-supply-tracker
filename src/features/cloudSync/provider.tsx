import { useState, useCallback, useEffect, type ReactNode } from 'react';
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

interface CloudSyncProviderProps {
  children: ReactNode;
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
      return {
        success: false,
        direction: 'none',
        timestamp: new Date().toISOString(),
        error: 'Not connected to a cloud provider',
      };
    }

    const provider = getProvider(state.provider) as CloudStorageProvider;
    if (!provider || !provider.isConnected()) {
      return {
        success: false,
        direction: 'none',
        timestamp: new Date().toISOString(),
        error: 'Not connected to cloud provider',
      };
    }

    setState((prev) => ({ ...prev, state: 'syncing', error: null }));

    try {
      const localData = getAppData();
      if (!localData) {
        return {
          success: false,
          direction: 'none',
          timestamp: new Date().toISOString(),
          error: 'No local data to sync',
        };
      }

      const localModified = new Date(localData.lastModified).getTime();
      let remoteModified = 0;
      let remoteFileId = state.remoteFileId;

      // Check if remote file exists and get its modification time
      if (remoteFileId) {
        const metadata = await provider.getFileMetadata(remoteFileId);
        if (metadata) {
          remoteModified = new Date(metadata.modifiedTime).getTime();
        } else {
          // File was deleted remotely
          remoteFileId = null;
        }
      }

      // If no remote file, try to find one
      if (!remoteFileId) {
        remoteFileId = await provider.findSyncFile();
        if (remoteFileId) {
          const metadata = await provider.getFileMetadata(remoteFileId);
          if (metadata) {
            remoteModified = new Date(metadata.modifiedTime).getTime();
          }
        }
      }

      const timestamp = new Date().toISOString();

      // Determine sync direction using last-write-wins
      if (!remoteFileId || localModified > remoteModified) {
        // Upload: local is newer or no remote file
        const dataJson = JSON.stringify(localData, null, 2);
        const newFileId = await provider.upload(
          dataJson,
          remoteFileId || undefined,
        );

        const newConfig: CloudSyncConfig = {
          provider: state.provider,
          lastSyncTimestamp: timestamp,
          remoteFileId: newFileId,
        };
        saveCloudSyncConfig(newConfig);

        setState({
          ...newConfig,
          state: 'connected',
          error: null,
        });

        return {
          success: true,
          direction: 'upload',
          timestamp,
        };
      } else if (remoteModified > localModified) {
        // Download: remote is newer
        const remoteDataJson = await provider.download(remoteFileId);
        const remoteData = JSON.parse(remoteDataJson);

        // Save remote data to localStorage
        saveAppData(remoteData);

        const newConfig: CloudSyncConfig = {
          provider: state.provider,
          lastSyncTimestamp: timestamp,
          remoteFileId,
        };
        saveCloudSyncConfig(newConfig);

        setState({
          ...newConfig,
          state: 'connected',
          error: null,
        });

        return {
          success: true,
          direction: 'download',
          timestamp,
          requiresReload: true,
        };
      } else {
        // No changes needed
        const newConfig: CloudSyncConfig = {
          provider: state.provider,
          lastSyncTimestamp: timestamp,
          remoteFileId,
        };
        saveCloudSyncConfig(newConfig);

        setState({
          ...newConfig,
          state: 'connected',
          error: null,
        });

        return {
          success: true,
          direction: 'none',
          timestamp,
        };
      }
    } catch (error) {
      const message =
        error instanceof CloudSyncError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Sync failed';

      setState((prev) => ({
        ...prev,
        state: 'error',
        error: message,
      }));

      return {
        success: false,
        direction: 'none',
        timestamp: new Date().toISOString(),
        error: message,
      };
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

  return (
    <CloudSyncContext.Provider
      value={{
        state,
        connect,
        disconnect,
        syncNow,
        clearError,
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  );
}
