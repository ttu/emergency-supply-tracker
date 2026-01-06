import { createContext } from 'react';
import type { CloudSyncContextValue } from './types';

/**
 * React context for cloud sync functionality.
 * Provides access to sync state and operations.
 */
export const CloudSyncContext = createContext<CloudSyncContextValue | null>(
  null,
);
