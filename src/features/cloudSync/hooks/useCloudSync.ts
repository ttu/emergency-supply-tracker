import { useContext } from 'react';
import { CloudSyncContext } from '../context';
import type { CloudSyncContextValue } from '../types';

/**
 * Hook to access cloud sync functionality.
 * Must be used within a CloudSyncProvider.
 */
export function useCloudSync(): CloudSyncContextValue {
  const context = useContext(CloudSyncContext);

  if (!context) {
    throw new Error('useCloudSync must be used within a CloudSyncProvider');
  }

  return context;
}
