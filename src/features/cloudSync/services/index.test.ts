import { describe, it, expect } from 'vitest';
// Test that all exports are properly re-exported from the index file
import * as servicesExports from './index';

describe('services/index exports', () => {
  it('should export GoogleDriveService', () => {
    expect(servicesExports.GoogleDriveService).toBeDefined();
  });

  it('should export token storage functions', () => {
    expect(servicesExports.storeTokens).toBeDefined();
    expect(servicesExports.getStoredTokens).toBeDefined();
    expect(servicesExports.clearTokens).toBeDefined();
    expect(servicesExports.areTokensExpired).toBeDefined();
    expect(servicesExports.updateAccessToken).toBeDefined();
    expect(servicesExports.getTokensForProvider).toBeDefined();
  });

  it('should export provider registry functions', () => {
    expect(servicesExports.registerProvider).toBeDefined();
    expect(servicesExports.getProvider).toBeDefined();
    expect(servicesExports.getAvailableProviders).toBeDefined();
    expect(servicesExports.isProviderAvailable).toBeDefined();
    expect(servicesExports.initializeProviders).toBeDefined();
    expect(servicesExports.resetProviders).toBeDefined();
  });
});
