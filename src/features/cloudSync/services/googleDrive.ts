/**
 * Google Drive cloud storage provider implementation.
 * Uses Google Identity Services for OAuth2 and Google Drive REST API for file operations.
 */

import type {
  CloudStorageProvider,
  CloudFileMetadata,
  StoredTokens,
} from '../types';
import { CloudSyncError } from '../types';
import {
  storeTokens,
  getTokensForProvider,
  clearTokens,
  areTokensExpired,
} from './tokenStorage';

// Google Drive API endpoints
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

// File name for sync data in Google Drive
const SYNC_FILE_NAME = 'emergency-supply-tracker.json';

// MIME types
const JSON_MIME_TYPE = 'application/json';

// OAuth scopes - minimal access (only files created by this app)
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Google Identity Services types (loaded from external script)
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (
            config: GoogleTokenClientConfig,
          ) => GoogleTokenClient;
        };
      };
    };
  }
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: GoogleTokenError) => void;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenError {
  type: string;
  message?: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

interface DriveFileList {
  files: DriveFile[];
  nextPageToken?: string;
}

/**
 * Google Drive implementation of CloudStorageProvider.
 */
export class GoogleDriveService implements CloudStorageProvider {
  readonly providerId = 'google-drive' as const;

  private tokenClient: GoogleTokenClient | null = null;
  private pendingAuthResolve: ((value: void) => void) | null = null;
  private pendingAuthReject: ((error: Error) => void) | null = null;
  private pendingAuthPromise: Promise<void> | null = null;

  /**
   * Initialize Google Identity Services token client.
   */
  private initTokenClient(): GoogleTokenClient {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new CloudSyncError(
        'Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID environment variable.',
        'AUTH_FAILED',
        false,
      );
    }

    if (!window.google?.accounts?.oauth2) {
      throw new CloudSyncError(
        'Google Identity Services not loaded. Check your internet connection.',
        'AUTH_FAILED',
        true,
      );
    }

    return window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: GoogleTokenResponse) => {
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
          accessToken: response.access_token,
          refreshToken: null, // GIS doesn't provide refresh tokens for implicit flow
          expiresAt: Date.now() + response.expires_in * 1000,
          provider: 'google-drive',
        };
        storeTokens(tokens);

        this.pendingAuthResolve?.();
      },
      error_callback: (error: GoogleTokenError) => {
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

  /**
   * Connect to Google Drive by initiating OAuth flow.
   */
  async connect(): Promise<void> {
    // Check if already connected with valid tokens
    if (this.isConnected() && !areTokensExpired()) {
      return;
    }

    // If auth is already in progress, wait for it (prevents race condition)
    if (this.pendingAuthPromise) {
      return this.pendingAuthPromise;
    }

    // Initialize token client if needed
    this.tokenClient ??= this.initTokenClient();

    // Request access token (opens Google sign-in popup)
    this.pendingAuthPromise = new Promise<void>((resolve, reject) => {
      this.pendingAuthResolve = resolve;
      this.pendingAuthReject = reject;

      // If we have expired tokens, request with prompt to allow switching accounts
      const hasExpiredTokens = getTokensForProvider('google-drive') !== null;
      this.tokenClient!.requestAccessToken({
        prompt: hasExpiredTokens ? '' : 'consent',
      });
    }).finally(() => {
      this.pendingAuthPromise = null;
    });

    return this.pendingAuthPromise;
  }

  /**
   * Disconnect from Google Drive.
   */
  async disconnect(): Promise<void> {
    const tokens = getTokensForProvider('google-drive');

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
    clearTokens();
    this.tokenClient = null;
  }

  /**
   * Check if connected with valid tokens.
   */
  isConnected(): boolean {
    const tokens = getTokensForProvider('google-drive');
    return tokens !== null && !areTokensExpired();
  }

  /**
   * Get current access token, reconnecting if expired.
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.isConnected()) {
      // Try to reconnect if we have tokens but they're expired
      const tokens = getTokensForProvider('google-drive');
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

    const tokens = getTokensForProvider('google-drive');
    return tokens?.accessToken ?? null;
  }

  /**
   * Make an authenticated request to Google Drive API.
   */
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
        errorData.error?.message || `API request failed: ${response.status}`;

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

  /**
   * Find existing sync file in Google Drive.
   */
  async findSyncFile(): Promise<string | null> {
    try {
      const query = `name='${SYNC_FILE_NAME}' and trashed=false`;
      const result = await this.apiRequest<DriveFileList>(
        `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`,
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

  /**
   * Upload data to Google Drive.
   * Creates new file or updates existing one.
   */
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
          `${DRIVE_UPLOAD_BASE}/files/${existingFileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': JSON_MIME_TYPE,
            },
            body: data,
          },
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = (await response.json()) as DriveFile;
        return result.id;
      } else {
        // Create new file with multipart upload
        const metadata = {
          name: SYNC_FILE_NAME,
          mimeType: JSON_MIME_TYPE,
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${JSON_MIME_TYPE}\r\n\r\n` +
          data +
          closeDelimiter;

        const response = await fetch(
          `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`,
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

        const result = (await response.json()) as DriveFile;
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

  /**
   * Download file content from Google Drive.
   */
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
        `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
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

  /**
   * Get file metadata from Google Drive.
   */
  async getFileMetadata(fileId: string): Promise<CloudFileMetadata | null> {
    try {
      const file = await this.apiRequest<DriveFile>(
        `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,modifiedTime,size`,
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
