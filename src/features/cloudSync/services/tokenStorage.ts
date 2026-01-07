/**
 * Token storage service for cloud sync OAuth tokens.
 * Stores tokens in localStorage separately from app data
 * to prevent accidental exposure through data export.
 */

import type { CloudProvider, StoredTokens } from '../types';

const TOKEN_STORAGE_KEY = 'emergencySupplyTracker_cloudTokens';

/**
 * Store OAuth tokens securely.
 */
export function storeTokens(tokens: StoredTokens): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Failed to store OAuth tokens:', error);
  }
}

/**
 * Retrieve stored OAuth tokens.
 */
export function getStoredTokens(): StoredTokens | null {
  try {
    const json = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!json) return null;

    const tokens: unknown = JSON.parse(json);

    // Validate structure before type assertion
    if (
      typeof tokens !== 'object' ||
      tokens === null ||
      !('accessToken' in tokens) ||
      typeof tokens.accessToken !== 'string' ||
      !('provider' in tokens) ||
      typeof tokens.provider !== 'string' ||
      !('expiresAt' in tokens) ||
      typeof tokens.expiresAt !== 'number' ||
      !('refreshToken' in tokens) ||
      (tokens.refreshToken !== null && typeof tokens.refreshToken !== 'string')
    ) {
      console.warn('Invalid token structure, clearing tokens');
      clearTokens();
      return null;
    }

    return tokens as StoredTokens;
  } catch (error) {
    console.error('Failed to retrieve OAuth tokens:', error);
    return null;
  }
}

/**
 * Clear all stored tokens (used on disconnect).
 */
export function clearTokens(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear OAuth tokens:', error);
  }
}

/**
 * Check if stored tokens are expired.
 * Returns true if tokens are expired or will expire within the buffer time.
 */
export function areTokensExpired(bufferMs: number = 60000): boolean {
  const tokens = getStoredTokens();
  if (!tokens) return true;

  const now = Date.now();
  return tokens.expiresAt - bufferMs <= now;
}

/**
 * Update just the access token and expiration (used after refresh).
 */
export function updateAccessToken(
  accessToken: string,
  expiresInSeconds: number,
): void {
  const tokens = getStoredTokens();
  if (!tokens) return;

  const updatedTokens: StoredTokens = {
    ...tokens,
    accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };

  storeTokens(updatedTokens);
}

/**
 * Get tokens for a specific provider.
 * Returns null if tokens are for a different provider.
 */
export function getTokensForProvider(
  provider: CloudProvider,
): StoredTokens | null {
  const tokens = getStoredTokens();
  if (!tokens || tokens.provider !== provider) return null;
  return tokens;
}
