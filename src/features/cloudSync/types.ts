/**
 * Cloud sync types for Emergency Supply Tracker.
 * Designed to be extensible for future providers (OneDrive, Dropbox).
 */

// Supported cloud storage providers
export type CloudProvider = 'google-drive';

// Sync state machine states
export type SyncState = 'disconnected' | 'connected' | 'syncing' | 'error';

// Direction of sync operation
export type SyncDirection = 'upload' | 'download' | 'none';

/**
 * Cloud sync configuration stored in localStorage.
 * Persisted separately from app data to avoid accidental export.
 */
export interface CloudSyncConfig {
  provider: CloudProvider | null;
  lastSyncTimestamp: string | null; // ISO 8601 timestamp
  remoteFileId: string | null; // Provider-specific file ID
}

/**
 * Full cloud sync state including runtime status.
 */
export interface CloudSyncState extends CloudSyncConfig {
  state: SyncState;
  error: string | null;
}

/**
 * Result of a sync operation.
 */
export interface SyncResult {
  success: boolean;
  direction: SyncDirection;
  timestamp: string; // ISO 8601 timestamp
  error?: string;
}

/**
 * Metadata about a remote file.
 */
export interface CloudFileMetadata {
  id: string;
  name: string;
  modifiedTime: string; // ISO 8601 timestamp
  size?: number;
}

/**
 * OAuth tokens stored securely.
 */
export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // Unix timestamp in milliseconds
  provider: CloudProvider;
}

/**
 * Abstract interface for cloud storage providers.
 * Implementations must handle authentication and file operations.
 */
export interface CloudStorageProvider {
  readonly providerId: CloudProvider;

  // Authentication
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Token management
  getAccessToken(): Promise<string | null>;

  // File operations
  upload(data: string, existingFileId?: string): Promise<string>; // Returns file ID
  download(fileId: string): Promise<string>; // Returns file content
  getFileMetadata(fileId: string): Promise<CloudFileMetadata | null>;
  findSyncFile(): Promise<string | null>; // Find existing sync file, returns file ID
}

/**
 * Cloud sync context value exposed to React components.
 */
export interface CloudSyncContextValue {
  state: CloudSyncState;
  connect: (provider: CloudProvider) => Promise<void>;
  disconnect: () => Promise<void>;
  syncNow: () => Promise<SyncResult>;
  clearError: () => void;
}

// Error codes for cloud sync operations
export type CloudSyncErrorCode =
  | 'AUTH_FAILED'
  | 'AUTH_CANCELLED'
  | 'TOKEN_EXPIRED'
  | 'NETWORK_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'FILE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'PARSE_ERROR'
  | 'UNKNOWN';

/**
 * Custom error class for cloud sync operations.
 */
export class CloudSyncError extends Error {
  constructor(
    message: string,
    public readonly code: CloudSyncErrorCode,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = 'CloudSyncError';
  }
}

// Type guards

export function isCloudProvider(value: unknown): value is CloudProvider {
  return value === 'google-drive';
}

export function isSyncState(value: unknown): value is SyncState {
  return (
    value === 'disconnected' ||
    value === 'connected' ||
    value === 'syncing' ||
    value === 'error'
  );
}

// Factory functions for creating default values

export function createDefaultCloudSyncConfig(): CloudSyncConfig {
  return {
    provider: null,
    lastSyncTimestamp: null,
    remoteFileId: null,
  };
}

export function createDefaultCloudSyncState(): CloudSyncState {
  return {
    ...createDefaultCloudSyncConfig(),
    state: 'disconnected',
    error: null,
  };
}
