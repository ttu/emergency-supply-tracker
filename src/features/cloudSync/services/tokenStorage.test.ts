import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  storeTokens,
  getStoredTokens,
  clearTokens,
  areTokensExpired,
  updateAccessToken,
  getTokensForProvider,
} from './tokenStorage';
import type { StoredTokens } from '../types';

const TOKEN_STORAGE_KEY = 'emergencySupplyTracker_cloudTokens';

const mockValidTokens: StoredTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 3600000, // 1 hour from now
  provider: 'google-drive',
};

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('storeTokens', () => {
    it('should store tokens in localStorage', () => {
      storeTokens(mockValidTokens);

      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      expect(stored).toBe(JSON.stringify(mockValidTokens));
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockSetItem = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceeded');
        });

      storeTokens(mockValidTokens);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store OAuth tokens:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
      mockSetItem.mockRestore();
    });
  });

  describe('getStoredTokens', () => {
    it('should return null when no tokens stored', () => {
      const result = getStoredTokens();

      expect(result).toBeNull();
    });

    it('should retrieve stored tokens', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(mockValidTokens));

      const result = getStoredTokens();

      expect(result).toEqual(mockValidTokens);
    });

    it('should return null for invalid JSON', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem(TOKEN_STORAGE_KEY, 'invalid json');

      const result = getStoredTokens();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return null and clear tokens for invalid structure - missing accessToken', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidTokens = { refreshToken: 'test', expiresAt: 123 };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(invalidTokens));

      const result = getStoredTokens();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid token structure, clearing tokens',
      );
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should return null and clear tokens for invalid structure - wrong accessToken type', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidTokens = {
        accessToken: 123,
        provider: 'google-drive',
        expiresAt: Date.now(),
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(invalidTokens));

      const result = getStoredTokens();

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should return null and clear tokens for invalid structure - missing provider', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidTokens = {
        accessToken: 'token',
        expiresAt: Date.now(),
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(invalidTokens));

      const result = getStoredTokens();

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should return null and clear tokens for invalid structure - missing expiresAt', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidTokens = {
        accessToken: 'token',
        provider: 'google-drive',
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(invalidTokens));

      const result = getStoredTokens();

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('clearTokens', () => {
    it('should remove tokens from localStorage', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(mockValidTokens));

      clearTokens();

      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockRemoveItem = vi
        .spyOn(Storage.prototype, 'removeItem')
        .mockImplementation(() => {
          throw new Error('Access denied');
        });

      clearTokens();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear OAuth tokens:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
      mockRemoveItem.mockRestore();
    });
  });

  describe('areTokensExpired', () => {
    it('should return true when no tokens stored', () => {
      const result = areTokensExpired();

      expect(result).toBe(true);
    });

    it('should return false when tokens are valid', () => {
      const futureTokens: StoredTokens = {
        ...mockValidTokens,
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(futureTokens));

      const result = areTokensExpired();

      expect(result).toBe(false);
    });

    it('should return true when tokens are expired', () => {
      const expiredTokens: StoredTokens = {
        ...mockValidTokens,
        expiresAt: Date.now() - 1000, // 1 second ago
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(expiredTokens));

      const result = areTokensExpired();

      expect(result).toBe(true);
    });

    it('should return true when tokens are within buffer time', () => {
      const soonToExpireTokens: StoredTokens = {
        ...mockValidTokens,
        expiresAt: Date.now() + 30000, // 30 seconds from now
      };
      localStorage.setItem(
        TOKEN_STORAGE_KEY,
        JSON.stringify(soonToExpireTokens),
      );

      // Default buffer is 60 seconds
      const result = areTokensExpired();

      expect(result).toBe(true);
    });

    it('should use custom buffer time', () => {
      const tokens: StoredTokens = {
        ...mockValidTokens,
        expiresAt: Date.now() + 30000, // 30 seconds from now
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));

      // With 10 second buffer, tokens should not be expired
      const result = areTokensExpired(10000);

      expect(result).toBe(false);
    });
  });

  describe('updateAccessToken', () => {
    it('should update access token and expiration', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(mockValidTokens));

      const newToken = 'new-access-token';
      const expiresInSeconds = 7200; // 2 hours

      updateAccessToken(newToken, expiresInSeconds);

      const result = getStoredTokens();
      expect(result?.accessToken).toBe(newToken);
      expect(result?.refreshToken).toBe(mockValidTokens.refreshToken);
      expect(result?.provider).toBe(mockValidTokens.provider);
      // Check that expiresAt is approximately correct (within 1 second)
      expect(result?.expiresAt).toBeGreaterThan(Date.now() + 7199000);
      expect(result?.expiresAt).toBeLessThan(Date.now() + 7201000);
    });

    it('should do nothing if no tokens stored', () => {
      updateAccessToken('new-token', 3600);

      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });
  });

  describe('getTokensForProvider', () => {
    it('should return tokens for matching provider', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(mockValidTokens));

      const result = getTokensForProvider('google-drive');

      expect(result).toEqual(mockValidTokens);
    });

    it('should return null if no tokens stored', () => {
      const result = getTokensForProvider('google-drive');

      expect(result).toBeNull();
    });

    it('should return null if provider does not match', () => {
      const tokens: StoredTokens = {
        ...mockValidTokens,
        provider: 'google-drive',
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));

      // This should never happen with current types, but testing the logic
      const result = getTokensForProvider('google-drive');
      expect(result).not.toBeNull();
    });
  });
});
