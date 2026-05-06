/**
 * OneDrive cloud storage provider implementation.
 * Uses MSAL.js for OAuth2 (PKCE) and Microsoft Graph API for file operations.
 *
 * The provider stores files in the application's dedicated app folder
 * (`/me/drive/special/approot`). With the `Files.ReadWrite.AppFolder`
 * scope the app only ever sees its own folder, never the user's wider
 * OneDrive contents.
 */

import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  BrowserAuthError,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';

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

// Microsoft Graph API endpoints
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
const APP_FOLDER_BASE = `${GRAPH_API_BASE}/me/drive/special/approot`;

// File name for sync data in the OneDrive app folder
const SYNC_FILE_NAME = 'emergency-supply-tracker.json';

// MIME types
const JSON_MIME_TYPE = 'application/json';

// OAuth scopes - app folder access only (cannot see other files)
const SCOPES = ['Files.ReadWrite.AppFolder'];

// MSAL authority - 'common' allows both personal Microsoft accounts and work/school
const AUTHORITY = 'https://login.microsoftonline.com/common';

interface DriveItem {
  id: string;
  name: string;
  size?: number;
  lastModifiedDateTime: string;
}

interface DriveItemList {
  value: DriveItem[];
}

/**
 * OneDrive implementation of CloudStorageProvider.
 */
export class OneDriveService implements CloudStorageProvider {
  readonly providerId = 'onedrive' as const;

  private msalInstance: PublicClientApplication | null = null;
  private msalInitialized = false;

  /**
   * Lazily build the MSAL public client app.
   * Throws if the client ID is missing so the UI can surface the config error.
   */
  private async getMsalInstance(): Promise<PublicClientApplication> {
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;

    if (!clientId) {
      throw new CloudSyncError(
        'Microsoft Client ID not configured. Set VITE_MICROSOFT_CLIENT_ID environment variable.',
        'AUTH_FAILED',
        false,
      );
    }

    if (!this.msalInstance) {
      this.msalInstance = new PublicClientApplication({
        auth: {
          clientId,
          authority: AUTHORITY,
          redirectUri: globalThis.location.origin,
        },
        cache: {
          // sessionStorage avoids persisting refresh tokens across browser
          // sessions; we mirror the access token into our own tokenStorage
          // for the brief expiry window.
          cacheLocation: 'sessionStorage',
        },
      });
    }

    if (!this.msalInitialized) {
      await this.msalInstance.initialize();
      this.msalInitialized = true;
    }

    return this.msalInstance;
  }

  /**
   * Persist the MSAL access token in our shared token storage so the
   * rest of the cloudSync layer can read it the same way it reads
   * Google Drive tokens.
   */
  private persistAuthResult(result: AuthenticationResult): void {
    const tokens: StoredTokens = {
      accessToken: result.accessToken,
      // MSAL keeps its own refresh token internally; we don't expose it.
      refreshToken: null,
      expiresAt: result.expiresOn?.getTime() ?? Date.now() + 60 * 60 * 1000,
      provider: 'onedrive',
    };
    storeTokens(tokens);
  }

  /**
   * Connect to OneDrive by initiating the popup-based OAuth flow.
   */
  async connect(): Promise<void> {
    if (this.isConnected() && !areTokensExpired()) {
      return;
    }

    const msal = await this.getMsalInstance();

    try {
      const result = await msal.loginPopup({
        scopes: SCOPES,
        prompt: 'select_account',
      });
      this.persistAuthResult(result);
    } catch (error) {
      if (error instanceof BrowserAuthError) {
        if (
          error.errorCode === 'user_cancelled' ||
          error.errorCode === 'popup_window_error'
        ) {
          throw new CloudSyncError(
            'Sign-in cancelled',
            'AUTH_CANCELLED',
            false,
          );
        }
      }
      throw new CloudSyncError(
        error instanceof Error ? error.message : 'Authentication failed',
        'AUTH_FAILED',
        true,
      );
    }
  }

  /**
   * Disconnect from OneDrive: clear MSAL cache and stored tokens.
   */
  async disconnect(): Promise<void> {
    try {
      const msal = await this.getMsalInstance();
      const account = msal.getAllAccounts()[0];
      if (account) {
        // Clear MSAL's local cache; we don't open a logout popup to avoid
        // stealing focus on user-initiated disconnects.
        await msal.clearCache({ account });
      }
    } catch {
      // Ignore cache-clear failures - we still want to drop our tokens.
    }

    clearTokens();
    this.msalInstance = null;
    this.msalInitialized = false;
  }

  /**
   * Check if connected with valid tokens.
   */
  isConnected(): boolean {
    const tokens = getTokensForProvider('onedrive');
    return tokens !== null && !areTokensExpired();
  }

  /**
   * Get current access token, refreshing silently via MSAL when needed.
   */
  async getAccessToken(): Promise<string | null> {
    if (this.isConnected()) {
      const tokens = getTokensForProvider('onedrive');
      return tokens?.accessToken ?? null;
    }

    // Try silent refresh through MSAL
    const tokens = getTokensForProvider('onedrive');
    if (!tokens) return null;

    try {
      const msal = await this.getMsalInstance();
      const account: AccountInfo | undefined = msal.getAllAccounts()[0];
      if (!account) return null;

      const result = await msal.acquireTokenSilent({
        scopes: SCOPES,
        account,
      });
      this.persistAuthResult(result);
      return result.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Re-auth needed — caller should prompt user to reconnect.
        return null;
      }
      return null;
    }
  }

  /**
   * Make an authenticated request to Microsoft Graph.
   */
  private async apiRequest<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new CloudSyncError(
        'Not authenticated with OneDrive',
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
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const message =
        errorData.error?.message ?? `API request failed: ${response.status}`;

      if (response.status === 401) {
        throw new CloudSyncError(message, 'TOKEN_EXPIRED', true);
      }
      if (response.status === 403) {
        throw new CloudSyncError(message, 'PERMISSION_DENIED', false);
      }
      if (response.status === 404) {
        throw new CloudSyncError(message, 'FILE_NOT_FOUND', false);
      }
      if (response.status === 507 || response.status === 509) {
        throw new CloudSyncError(message, 'QUOTA_EXCEEDED', false);
      }
      throw new CloudSyncError(message, 'UNKNOWN', true);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Find existing sync file in the OneDrive app folder.
   */
  async findSyncFile(): Promise<string | null> {
    try {
      const result = await this.apiRequest<DriveItemList>(
        `${APP_FOLDER_BASE}/children?$select=id,name,lastModifiedDateTime`,
      );

      const file = result.value?.find((item) => item.name === SYNC_FILE_NAME);
      return file?.id ?? null;
    } catch (error) {
      if (error instanceof CloudSyncError) {
        // App folder doesn't exist yet — same as "no sync file".
        if (error.code === 'FILE_NOT_FOUND') return null;
        throw error;
      }
      throw new CloudSyncError(
        'Failed to search for sync file',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  /**
   * Upload data to OneDrive.
   * Creates new file or replaces existing one (PUT to content endpoint).
   */
  async upload(data: string, existingFileId?: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new CloudSyncError(
        'Not authenticated with OneDrive',
        'AUTH_FAILED',
        false,
      );
    }

    const url = existingFileId
      ? `${GRAPH_API_BASE}/me/drive/items/${existingFileId}/content`
      : `${APP_FOLDER_BASE}:/${encodeURIComponent(SYNC_FILE_NAME)}:/content`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': JSON_MIME_TYPE,
        },
        body: data,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new CloudSyncError(
            'Authentication expired during upload',
            'TOKEN_EXPIRED',
            true,
          );
        }
        if (response.status === 507 || response.status === 509) {
          throw new CloudSyncError(
            'OneDrive storage quota exceeded',
            'QUOTA_EXCEEDED',
            false,
          );
        }
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = (await response.json()) as DriveItem;
      return result.id;
    } catch (error) {
      if (error instanceof CloudSyncError) throw error;
      throw new CloudSyncError(
        'Failed to upload data to OneDrive',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  /**
   * Download file content from OneDrive.
   */
  async download(fileId: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new CloudSyncError(
        'Not authenticated with OneDrive',
        'AUTH_FAILED',
        false,
      );
    }

    try {
      const response = await fetch(
        `${GRAPH_API_BASE}/me/drive/items/${fileId}/content`,
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
        'Failed to download data from OneDrive',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  /**
   * Get file metadata from OneDrive.
   */
  async getFileMetadata(fileId: string): Promise<CloudFileMetadata | null> {
    try {
      const item = await this.apiRequest<DriveItem>(
        `${GRAPH_API_BASE}/me/drive/items/${fileId}?$select=id,name,lastModifiedDateTime,size`,
      );

      return {
        id: item.id,
        name: item.name,
        modifiedTime: item.lastModifiedDateTime,
        size: item.size,
      };
    } catch (error) {
      if (error instanceof CloudSyncError && error.code === 'FILE_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }
}
