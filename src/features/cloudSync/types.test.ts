import {
  CloudSyncError,
  isCloudProvider,
  isSyncState,
  createDefaultCloudSyncConfig,
  createDefaultCloudSyncState,
} from './types';

describe('CloudSyncError', () => {
  it('should create error with correct properties', () => {
    const error = new CloudSyncError('Auth failed', 'AUTH_FAILED', true);

    expect(error.message).toBe('Auth failed');
    expect(error.code).toBe('AUTH_FAILED');
    expect(error.isRetryable).toBe(true);
    expect(error.name).toBe('CloudSyncError');
  });

  it('should default isRetryable to false', () => {
    const error = new CloudSyncError('Network error', 'NETWORK_ERROR');

    expect(error.isRetryable).toBe(false);
  });

  it('should be instanceof Error', () => {
    const error = new CloudSyncError('Test', 'UNKNOWN');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CloudSyncError);
  });
});

describe('isCloudProvider', () => {
  it('should return true for valid provider', () => {
    expect(isCloudProvider('google-drive')).toBe(true);
  });

  it('should return false for invalid provider', () => {
    expect(isCloudProvider('onedrive')).toBe(false);
    expect(isCloudProvider('dropbox')).toBe(false);
    expect(isCloudProvider('')).toBe(false);
    expect(isCloudProvider(null)).toBe(false);
    expect(isCloudProvider(undefined)).toBe(false);
    expect(isCloudProvider(123)).toBe(false);
  });
});

describe('isSyncState', () => {
  it('should return true for valid states', () => {
    expect(isSyncState('disconnected')).toBe(true);
    expect(isSyncState('connected')).toBe(true);
    expect(isSyncState('syncing')).toBe(true);
    expect(isSyncState('error')).toBe(true);
  });

  it('should return false for invalid states', () => {
    expect(isSyncState('pending')).toBe(false);
    expect(isSyncState('')).toBe(false);
    expect(isSyncState(null)).toBe(false);
    expect(isSyncState(undefined)).toBe(false);
    expect(isSyncState(123)).toBe(false);
  });
});

describe('createDefaultCloudSyncConfig', () => {
  it('should return default config', () => {
    const config = createDefaultCloudSyncConfig();

    expect(config).toEqual({
      provider: null,
      lastSyncTimestamp: null,
      remoteFileId: null,
    });
  });
});

describe('createDefaultCloudSyncState', () => {
  it('should return default state', () => {
    const state = createDefaultCloudSyncState();

    expect(state).toEqual({
      provider: null,
      lastSyncTimestamp: null,
      remoteFileId: null,
      state: 'disconnected',
      error: null,
    });
  });
});
