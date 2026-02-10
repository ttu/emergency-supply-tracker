/**
 * @vitest-environment jsdom
 *
 * Tests for GoogleDriveService functionality.
 *
 * We test a TestableGoogleDriveService class that mirrors the real implementation
 * but allows us to inject the client ID via setClientId() instead of reading
 * from import.meta.env.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { CloudSyncError } from '../types';
import type { CloudStorageProvider, StoredTokens } from '../types';
import * as tokenStorage from './tokenStorage';

// Mock tokenStorage module
vi.mock('./tokenStorage', () => ({
  storeTokens: vi.fn(),
  getTokensForProvider: vi.fn(),
  clearTokens: vi.fn(),
  areTokensExpired: vi.fn(),
}));

// Create a testable version of GoogleDriveService that doesn't use import.meta.env
class TestableGoogleDriveService implements CloudStorageProvider {
  readonly providerId = 'google-drive' as const;

  private tokenClient: {
    requestAccessToken: (options?: { prompt?: string }) => void;
  } | null = null;
  private pendingAuthResolve: ((value: void) => void) | null = null;
  private pendingAuthReject: ((error: Error) => void) | null = null;
  private pendingAuthPromise: Promise<void> | null = null;
  private mockClientId: string = 'test-client-id';

  setClientId(clientId: string) {
    this.mockClientId = clientId;
  }

  private initTokenClient(): {
    requestAccessToken: (options?: { prompt?: string }) => void;
  } {
    const clientId = this.mockClientId;

    if (!clientId) {
      throw new CloudSyncError(
        'Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID environment variable.',
        'AUTH_FAILED',
        false,
      );
    }

    if (
      !(globalThis as typeof globalThis & { google?: typeof globalThis.google })
        .google?.accounts?.oauth2
    ) {
      throw new CloudSyncError(
        'Google Identity Services not loaded. Check your internet connection.',
        'AUTH_FAILED',
        true,
      );
    }

    return (
      globalThis as typeof globalThis & {
        google: NonNullable<typeof globalThis.google>;
      }
    ).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: {
        access_token?: string;
        expires_in?: number;
        error?: string;
        error_description?: string;
      }) => {
        if (response.error) {
          this.pendingAuthReject?.(
            new CloudSyncError(
              response.error_description || response.error,
              'AUTH_FAILED',
              false,
            ),
          );
          return;
        }

        // Store tokens
        const tokens: StoredTokens = {
          accessToken: response.access_token!,
          refreshToken: null,
          expiresAt: Date.now() + response.expires_in! * 1000,
          provider: 'google-drive',
        };
        tokenStorage.storeTokens(tokens);

        this.pendingAuthResolve?.();
      },
      error_callback: (error: { type: string; message?: string }) => {
        if (error.type === 'popup_closed') {
          this.pendingAuthReject?.(
            new CloudSyncError('Sign-in cancelled', 'AUTH_CANCELLED', false),
          );
        } else {
          this.pendingAuthReject?.(
            new CloudSyncError(
              error.message || 'Authentication failed',
              'AUTH_FAILED',
              true,
            ),
          );
        }
      },
    });
  }

  async connect(): Promise<void> {
    // Check if already connected with valid tokens
    if (this.isConnected() && !tokenStorage.areTokensExpired()) {
      return;
    }

    // If auth is already in progress, wait for it (prevents race condition)
    if (this.pendingAuthPromise) {
      return this.pendingAuthPromise;
    }

    // Initialize token client if needed
    if (!this.tokenClient) {
      this.tokenClient = this.initTokenClient();
    }

    // Request access token (opens Google sign-in popup)
    this.pendingAuthPromise = new Promise<void>((resolve, reject) => {
      this.pendingAuthResolve = resolve;
      this.pendingAuthReject = reject;

      // If we have existing tokens, allow account switching; otherwise request consent
      const hasExistingTokens =
        tokenStorage.getTokensForProvider('google-drive') !== null;
      this.tokenClient!.requestAccessToken({
        prompt: hasExistingTokens ? 'select_account' : 'consent',
      });
    }).finally(() => {
      this.pendingAuthPromise = null;
    });

    return this.pendingAuthPromise;
  }

  async disconnect(): Promise<void> {
    const tokens = tokenStorage.getTokensForProvider('google-drive');

    // Revoke the token if we have one
    if (tokens?.accessToken) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`,
          { method: 'POST' },
        );
      } catch {
        // Ignore revocation errors - token might already be invalid
      }
    }

    // Clear stored tokens
    tokenStorage.clearTokens();
    this.tokenClient = null;
  }

  isConnected(): boolean {
    const tokens = tokenStorage.getTokensForProvider('google-drive');
    return tokens !== null && !tokenStorage.areTokensExpired();
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.isConnected()) {
      // Try to reconnect if we have tokens but they're expired
      const tokens = tokenStorage.getTokensForProvider('google-drive');
      if (tokens) {
        try {
          await this.connect();
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }

    const tokens = tokenStorage.getTokensForProvider('google-drive');
    return tokens?.accessToken ?? null;
  }

  private async apiRequest<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new CloudSyncError(
        'Not authenticated with Google Drive',
        'AUTH_FAILED',
        false,
      );
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        (errorData as { error?: { message?: string } }).error?.message ||
        `API request failed: ${response.status}`;

      if (response.status === 401) {
        throw new CloudSyncError(message, 'TOKEN_EXPIRED', true);
      }
      if (response.status === 403) {
        throw new CloudSyncError(message, 'PERMISSION_DENIED', false);
      }
      if (response.status === 404) {
        throw new CloudSyncError(message, 'FILE_NOT_FOUND', false);
      }
      if (response.status === 507) {
        throw new CloudSyncError(message, 'QUOTA_EXCEEDED', false);
      }

      throw new CloudSyncError(message, 'UNKNOWN', true);
    }

    return response.json() as Promise<T>;
  }

  async findSyncFile(): Promise<string | null> {
    try {
      const query = `name='emergency-supply-tracker.json' and trashed=false`;
      const result = await this.apiRequest<{
        files: Array<{ id: string; name: string; modifiedTime: string }>;
      }>(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`,
      );

      if (result.files && result.files.length > 0) {
        return result.files[0].id;
      }

      return null;
    } catch (error) {
      if (error instanceof CloudSyncError) throw error;
      throw new CloudSyncError(
        'Failed to search for sync file',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  async upload(data: string, existingFileId?: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new CloudSyncError(
        'Not authenticated with Google Drive',
        'AUTH_FAILED',
        false,
      );
    }

    try {
      if (existingFileId) {
        // Update existing file
        const response = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: data,
          },
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = (await response.json()) as { id: string };
        return result.id;
      } else {
        // Create new file with multipart upload
        const metadata = {
          name: 'emergency-supply-tracker.json',
          mimeType: 'application/json',
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          data +
          closeDelimiter;

        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
          },
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = (await response.json()) as { id: string };
        return result.id;
      }
    } catch (error) {
      if (error instanceof CloudSyncError) throw error;
      throw new CloudSyncError(
        'Failed to upload data to Google Drive',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  async download(fileId: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new CloudSyncError(
        'Not authenticated with Google Drive',
        'AUTH_FAILED',
        false,
      );
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new CloudSyncError(
            'Sync file not found',
            'FILE_NOT_FOUND',
            false,
          );
        }
        throw new Error(`Download failed: ${response.status}`);
      }

      return response.text();
    } catch (error) {
      if (error instanceof CloudSyncError) throw error;
      throw new CloudSyncError(
        'Failed to download data from Google Drive',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  async getFileMetadata(fileId: string): Promise<{
    id: string;
    name: string;
    modifiedTime: string;
    size?: number;
  } | null> {
    try {
      const file = await this.apiRequest<{
        id: string;
        name: string;
        modifiedTime: string;
        size?: string;
      }>(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,modifiedTime,size`,
      );

      return {
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        size: file.size ? Number.parseInt(file.size, 10) : undefined,
      };
    } catch (error) {
      if (error instanceof CloudSyncError && error.code === 'FILE_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }
}

// Note: Window.google is already declared in googleDrive.ts
// We use type assertions in the test code instead of redeclaring

describe('GoogleDriveService', () => {
  let service: TestableGoogleDriveService;
  let mockTokenClient: {
    requestAccessToken: Mock;
  };
  let mockInitTokenClient: Mock;
  let tokenCallback:
    | ((response: {
        access_token?: string;
        expires_in?: number;
        error?: string;
        error_description?: string;
      }) => void)
    | null = null;
  let errorCallback:
    | ((error: { type: string; message?: string }) => void)
    | null = null;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;

    // Setup mock token client
    mockTokenClient = {
      requestAccessToken: vi.fn(),
    };

    mockInitTokenClient = vi.fn((config) => {
      tokenCallback = config.callback;
      errorCallback = config.error_callback;
      return mockTokenClient;
    });

    // Setup globalThis.google mock
    // Use type assertion to avoid interface declaration conflicts
    (
      globalThis as typeof globalThis & {
        google?: {
          accounts: {
            oauth2: {
              initTokenClient: typeof mockInitTokenClient;
            };
          };
        };
      }
    ).google = {
      accounts: {
        oauth2: {
          initTokenClient: mockInitTokenClient,
        },
      },
    };

    // Default mock implementations
    (tokenStorage.getTokensForProvider as Mock).mockReturnValue(null);
    (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);

    service = new TestableGoogleDriveService();
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { google?: unknown }).google;
    globalThis.fetch = originalFetch;
  });

  describe('providerId', () => {
    it('should have google-drive as providerId', () => {
      expect(service.providerId).toBe('google-drive');
    });
  });

  describe('connect', () => {
    it('should return early if already connected with valid tokens', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);

      await service.connect();

      expect(mockInitTokenClient).not.toHaveBeenCalled();
    });

    it('should throw error if client ID is not configured', async () => {
      service.setClientId('');

      await expect(service.connect()).rejects.toThrow(CloudSyncError);
      await expect(service.connect()).rejects.toThrow(
        'Google Client ID not configured',
      );
    });

    it('should throw error if Google Identity Services not loaded', async () => {
      delete (globalThis as typeof globalThis & { google?: unknown }).google;

      await expect(service.connect()).rejects.toThrow(CloudSyncError);
      await expect(service.connect()).rejects.toThrow(
        'Google Identity Services not loaded',
      );
    });

    it('should initialize token client and request access token', async () => {
      const connectPromise = service.connect();

      // Simulate successful auth callback
      tokenCallback?.({
        access_token: 'new-token',
        expires_in: 3600,
      });

      await connectPromise;

      expect(mockInitTokenClient).toHaveBeenCalled();
      expect(mockTokenClient.requestAccessToken).toHaveBeenCalledWith({
        prompt: 'consent',
      });
      expect(tokenStorage.storeTokens).toHaveBeenCalled();
    });

    it('should handle auth error response', async () => {
      const connectPromise = service.connect();

      tokenCallback?.({
        error: 'access_denied',
        error_description: 'User denied access',
      });

      await expect(connectPromise).rejects.toThrow('User denied access');
    });

    it('should handle popup closed error', async () => {
      const connectPromise = service.connect();

      errorCallback?.({ type: 'popup_closed' });

      await expect(connectPromise).rejects.toThrow('Sign-in cancelled');
    });

    it('should handle other auth errors', async () => {
      const connectPromise = service.connect();

      errorCallback?.({ type: 'unknown', message: 'Something went wrong' });

      await expect(connectPromise).rejects.toThrow('Something went wrong');
    });

    it('should reuse pending auth promise for concurrent calls', async () => {
      // Start the first connect - this creates the pending promise
      const promise1 = service.connect();

      // Start a second connect while the first is in progress
      // Due to the pendingAuthPromise guard, both should resolve together
      const promise2 = service.connect();

      // Resolve the auth
      tokenCallback?.({
        access_token: 'token',
        expires_in: 3600,
      });

      await Promise.all([promise1, promise2]);

      // Only one token request should have been made
      expect(mockTokenClient.requestAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should request account selection when renewing existing tokens', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000,
        provider: 'google-drive',
        refreshToken: null,
      });

      const connectPromise = service.connect();

      tokenCallback?.({
        access_token: 'new-token',
        expires_in: 3600,
      });

      await connectPromise;

      expect(mockTokenClient.requestAccessToken).toHaveBeenCalledWith({
        prompt: 'select_account',
      });
    });
  });

  describe('disconnect', () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    });

    it('should revoke token and clear storage', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });

      await service.disconnect();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/revoke?token=valid-token',
        { method: 'POST' },
      );
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should clear storage even if revoke fails', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (globalThis.fetch as Mock).mockRejectedValue(new Error('Network error'));

      await service.disconnect();

      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should handle no tokens case', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue(null);

      await service.disconnect();

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('should return false when no tokens', () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue(null);

      expect(service.isConnected()).toBe(false);
    });

    it('should return false when tokens expired', () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'token',
        expiresAt: Date.now() - 1000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);

      expect(service.isConnected()).toBe(false);
    });

    it('should return true when tokens valid', () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);

      expect(service.isConnected()).toBe(true);
    });
  });

  describe('getAccessToken', () => {
    it('should return token when connected', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'my-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);

      const token = await service.getAccessToken();

      expect(token).toBe('my-token');
    });

    it('should return null when no tokens and not expired', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue(null);

      const token = await service.getAccessToken();

      expect(token).toBeNull();
    });

    it('should try to reconnect when tokens expired', async () => {
      let callCount = 0;
      (tokenStorage.getTokensForProvider as Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: expired tokens
          return {
            accessToken: 'expired',
            expiresAt: Date.now() - 1000,
            provider: 'google-drive',
            refreshToken: null,
          };
        }
        // After reconnect: new tokens
        return {
          accessToken: 'new-token',
          expiresAt: Date.now() + 3600000,
          provider: 'google-drive',
          refreshToken: null,
        };
      });
      (tokenStorage.areTokensExpired as Mock)
        .mockReturnValueOnce(true)
        .mockReturnValue(false);

      const tokenPromise = service.getAccessToken();

      // Simulate successful reconnection
      tokenCallback?.({
        access_token: 'new-token',
        expires_in: 3600,
      });

      const token = await tokenPromise;
      expect(token).toBe('new-token');
    });

    it('should return null when reconnection fails', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'expired',
        expiresAt: Date.now() - 1000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);

      const tokenPromise = service.getAccessToken();

      // Simulate failed reconnection
      errorCallback?.({ type: 'popup_closed' });

      const token = await tokenPromise;
      expect(token).toBeNull();
    });
  });

  describe('findSyncFile', () => {
    beforeEach(() => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);
    });

    it('should return file id when found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            files: [{ id: 'file-123', name: 'test.json', modifiedTime: '' }],
          }),
      });

      const fileId = await service.findSyncFile();

      expect(fileId).toBe('file-123');
    });

    it('should return null when no files found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      });

      const fileId = await service.findSyncFile();

      expect(fileId).toBeNull();
    });

    it('should throw CloudSyncError on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.findSyncFile()).rejects.toThrow(CloudSyncError);
      await expect(service.findSyncFile()).rejects.toThrow(
        'Failed to search for sync file',
      );
    });
  });

  describe('upload', () => {
    beforeEach(() => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);
    });

    it('should update existing file', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'existing-file-id' }),
      });

      const fileId = await service.upload(
        '{"data": "test"}',
        'existing-file-id',
      );

      expect(fileId).toBe('existing-file-id');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('existing-file-id'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('should create new file with multipart upload', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'new-file-id' }),
      });

      const fileId = await service.upload('{"data": "test"}');

      expect(fileId).toBe('new-file-id');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('uploadType=multipart'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw error when not authenticated', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue(null);

      await expect(service.upload('data')).rejects.toThrow(
        'Not authenticated with Google Drive',
      );
    });

    it('should throw CloudSyncError on upload failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.upload('data')).rejects.toThrow(CloudSyncError);
    });
  });

  describe('download', () => {
    beforeEach(() => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);
    });

    it('should download file content', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{"downloaded": "data"}'),
      });

      const content = await service.download('file-id');

      expect(content).toBe('{"downloaded": "data"}');
    });

    it('should throw FILE_NOT_FOUND on 404', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(service.download('file-id')).rejects.toThrow(
        'Sync file not found',
      );
    });

    it('should throw error when not authenticated', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue(null);

      await expect(service.download('file-id')).rejects.toThrow(
        'Not authenticated with Google Drive',
      );
    });

    it('should throw CloudSyncError on other failures', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.download('file-id')).rejects.toThrow(CloudSyncError);
    });
  });

  describe('getFileMetadata', () => {
    beforeEach(() => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);
    });

    it('should return file metadata', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'file-id',
            name: 'test.json',
            modifiedTime: '2024-01-01T00:00:00Z',
            size: '1024',
          }),
      });

      const metadata = await service.getFileMetadata('file-id');

      expect(metadata).toEqual({
        id: 'file-id',
        name: 'test.json',
        modifiedTime: '2024-01-01T00:00:00Z',
        size: 1024,
      });
    });

    it('should return null for FILE_NOT_FOUND', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: { message: 'Not found' } }),
      });

      const metadata = await service.getFileMetadata('file-id');

      expect(metadata).toBeNull();
    });

    it('should handle missing size field', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'file-id',
            name: 'test.json',
            modifiedTime: '2024-01-01T00:00:00Z',
          }),
      });

      const metadata = await service.getFileMetadata('file-id');

      expect(metadata?.size).toBeUndefined();
    });
  });

  describe('apiRequest error handling', () => {
    beforeEach(() => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
        provider: 'google-drive',
        refreshToken: null,
      });
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);
    });

    it('should throw TOKEN_EXPIRED on 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Token expired' } }),
      });

      await expect(service.getFileMetadata('file-id')).rejects.toThrow(
        CloudSyncError,
      );
      await expect(service.getFileMetadata('file-id')).rejects.toMatchObject({
        code: 'TOKEN_EXPIRED',
      });
    });

    it('should throw PERMISSION_DENIED on 403', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: { message: 'Access denied' } }),
      });

      await expect(service.getFileMetadata('file-id')).rejects.toThrow(
        CloudSyncError,
      );
      await expect(service.getFileMetadata('file-id')).rejects.toMatchObject({
        code: 'PERMISSION_DENIED',
      });
    });

    it('should throw QUOTA_EXCEEDED on 507', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 507,
        json: () => Promise.resolve({ error: { message: 'Storage full' } }),
      });

      await expect(service.getFileMetadata('file-id')).rejects.toThrow(
        CloudSyncError,
      );
      await expect(service.getFileMetadata('file-id')).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
      });
    });

    it('should throw UNKNOWN on other status codes', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(service.getFileMetadata('file-id')).rejects.toThrow(
        CloudSyncError,
      );
      await expect(service.getFileMetadata('file-id')).rejects.toMatchObject({
        code: 'UNKNOWN',
      });
    });
  });
});
