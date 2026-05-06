/**
 * @vitest-environment jsdom
 *
 * Tests for OneDriveService.
 *
 * We mock both `@azure/msal-browser` and `tokenStorage` to focus on Graph API
 * interactions (auth flow correctness is left to MSAL's own tests).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { CloudSyncError } from '../types';
import * as tokenStorage from './tokenStorage';

vi.mock('./tokenStorage', () => ({
  storeTokens: vi.fn(),
  getTokensForProvider: vi.fn(),
  clearTokens: vi.fn(),
  areTokensExpired: vi.fn(),
}));

const msalMocks = vi.hoisted(() => ({
  loginPopup: vi.fn(),
  acquireTokenSilent: vi.fn(),
  getAllAccounts: vi.fn(),
  clearCache: vi.fn(),
  initialize: vi.fn(),
}));

vi.mock('@azure/msal-browser', () => {
  class BrowserAuthError extends Error {
    constructor(
      public errorCode: string,
      message?: string,
    ) {
      super(message ?? errorCode);
      this.name = 'BrowserAuthError';
    }
  }
  class InteractionRequiredAuthError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'InteractionRequiredAuthError';
    }
  }
  class PublicClientApplication {
    initialize = msalMocks.initialize;
    loginPopup = msalMocks.loginPopup;
    acquireTokenSilent = msalMocks.acquireTokenSilent;
    getAllAccounts = msalMocks.getAllAccounts;
    clearCache = msalMocks.clearCache;
  }
  return {
    PublicClientApplication,
    BrowserAuthError,
    InteractionRequiredAuthError,
  };
});

const {
  loginPopup: mockLoginPopup,
  acquireTokenSilent: mockAcquireTokenSilent,
  getAllAccounts: mockGetAllAccounts,
  clearCache: mockClearCache,
  initialize: mockInitialize,
} = msalMocks;

// Stub the Vite env var read by OneDriveService
vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'test-ms-client-id');

// Import after mocks are set up
import { OneDriveService } from './oneDrive';

describe('OneDriveService', () => {
  let service: OneDriveService;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;

    (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
      accessToken: 'mock-access-token',
      refreshToken: null,
      expiresAt: Date.now() + 3_600_000,
      provider: 'onedrive',
    });
    (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);

    mockInitialize.mockResolvedValue(undefined);
    service = new OneDriveService();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('connect', () => {
    it('returns immediately when already connected with valid tokens', async () => {
      await service.connect();
      expect(mockLoginPopup).not.toHaveBeenCalled();
    });

    it('calls loginPopup and stores tokens on success', async () => {
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      const expiresOn = new Date(Date.now() + 3_600_000);
      mockLoginPopup.mockResolvedValue({
        accessToken: 'new-access-token',
        expiresOn,
      });

      await service.connect();

      expect(mockLoginPopup).toHaveBeenCalledWith({
        scopes: ['Files.ReadWrite.AppFolder'],
        prompt: 'select_account',
      });
      expect(tokenStorage.storeTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'new-access-token',
          provider: 'onedrive',
          expiresAt: expiresOn.getTime(),
        }),
      );
    });

    it('throws AUTH_CANCELLED when user cancels popup', async () => {
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      const { BrowserAuthError } = await import('@azure/msal-browser');
      mockLoginPopup.mockRejectedValue(
        new BrowserAuthError('user_cancelled', 'User cancelled'),
      );

      await expect(service.connect()).rejects.toMatchObject({
        code: 'AUTH_CANCELLED',
      });
    });

    it('throws AUTH_FAILED when client ID is missing', async () => {
      vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', '');
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      const freshService = new OneDriveService();

      await expect(freshService.connect()).rejects.toBeInstanceOf(
        CloudSyncError,
      );

      vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'test-ms-client-id');
    });
  });

  describe('disconnect', () => {
    it('clears MSAL cache and stored tokens', async () => {
      mockGetAllAccounts.mockReturnValue([
        { homeAccountId: 'home', username: 'user@example.com' },
      ]);
      mockClearCache.mockResolvedValue(undefined);

      await service.disconnect();

      expect(mockClearCache).toHaveBeenCalled();
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('still clears tokens when MSAL cache clear fails', async () => {
      mockGetAllAccounts.mockReturnValue([
        { homeAccountId: 'home', username: 'user@example.com' },
      ]);
      mockClearCache.mockRejectedValue(new Error('cache fail'));

      await service.disconnect();

      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('returns true when token present and not expired', () => {
      expect(service.isConnected()).toBe(true);
    });

    it('returns false when tokens are expired', () => {
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      expect(service.isConnected()).toBe(false);
    });

    it('returns false when no tokens stored', () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue(null);
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('returns stored token when connected', async () => {
      const token = await service.getAccessToken();
      expect(token).toBe('mock-access-token');
    });

    it('attempts silent refresh when token expired and account present', async () => {
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      mockGetAllAccounts.mockReturnValue([
        { homeAccountId: 'home', username: 'user@example.com' },
      ]);
      mockAcquireTokenSilent.mockResolvedValue({
        accessToken: 'refreshed-token',
        expiresOn: new Date(Date.now() + 3_600_000),
      });

      const token = await service.getAccessToken();
      expect(token).toBe('refreshed-token');
      expect(tokenStorage.storeTokens).toHaveBeenCalled();
    });

    it('returns null when interaction is required', async () => {
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      mockGetAllAccounts.mockReturnValue([
        { homeAccountId: 'home', username: 'user@example.com' },
      ]);
      const { InteractionRequiredAuthError } = await import(
        '@azure/msal-browser'
      );
      mockAcquireTokenSilent.mockRejectedValue(
        new InteractionRequiredAuthError('interaction_required'),
      );

      const token = await service.getAccessToken();
      expect(token).toBeNull();
    });
  });

  describe('findSyncFile', () => {
    it('returns id when sync file exists in app folder', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          value: [
            {
              id: 'file-123',
              name: 'emergency-supply-tracker.json',
              lastModifiedDateTime: '2026-05-05T10:00:00Z',
            },
          ],
        }),
      });

      const id = await service.findSyncFile();
      expect(id).toBe('file-123');
    });

    it('returns null when no matching file in app folder', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ value: [] }),
      });

      const id = await service.findSyncFile();
      expect(id).toBeNull();
    });

    it('returns null when app folder does not exist (404)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'not found' } }),
      });

      const id = await service.findSyncFile();
      expect(id).toBeNull();
    });
  });

  describe('upload', () => {
    it('PUTs to app folder content endpoint when no existing file', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'new-id' }),
      });
      globalThis.fetch = fetchMock;

      const id = await service.upload('{"hello":"world"}');

      expect(id).toBe('new-id');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('special/approot:/');
      expect(url).toContain('emergency-supply-tracker.json');
      expect(url).toContain(':/content');
      expect(init.method).toBe('PUT');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.body).toBe('{"hello":"world"}');
    });

    it('PUTs to items/{id}/content when updating existing file', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'existing-id' }),
      });
      globalThis.fetch = fetchMock;

      await service.upload('{}', 'existing-id');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/me/drive/items/existing-id/content');
    });

    it('throws TOKEN_EXPIRED on 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(service.upload('{}')).rejects.toMatchObject({
        code: 'TOKEN_EXPIRED',
      });
    });

    it('throws QUOTA_EXCEEDED on 507', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 507,
      });

      await expect(service.upload('{}')).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
      });
    });

    it('throws AUTH_FAILED when no access token', async () => {
      (tokenStorage.getTokensForProvider as Mock).mockReturnValue(null);

      await expect(service.upload('{}')).rejects.toMatchObject({
        code: 'AUTH_FAILED',
      });
    });
  });

  describe('download', () => {
    it('returns file content on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '{"data":"x"}',
      });

      const content = await service.download('file-id');
      expect(content).toBe('{"data":"x"}');
    });

    it('throws FILE_NOT_FOUND on 404', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(service.download('missing-id')).rejects.toMatchObject({
        code: 'FILE_NOT_FOUND',
      });
    });
  });

  describe('getFileMetadata', () => {
    it('returns mapped metadata on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'abc',
          name: 'emergency-supply-tracker.json',
          lastModifiedDateTime: '2026-05-05T12:00:00Z',
          size: 1234,
        }),
      });

      const meta = await service.getFileMetadata('abc');
      expect(meta).toEqual({
        id: 'abc',
        name: 'emergency-supply-tracker.json',
        modifiedTime: '2026-05-05T12:00:00Z',
        size: 1234,
      });
    });

    it('returns null when file not found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      const meta = await service.getFileMetadata('missing');
      expect(meta).toBeNull();
    });
  });
});
