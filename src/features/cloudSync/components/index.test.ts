import { describe, it, expect } from 'vitest';
// Test that all exports are properly re-exported from the index file
import * as componentsExports from './index';

describe('components/index exports', () => {
  it('should export CloudSyncSection', () => {
    expect(componentsExports.CloudSyncSection).toBeDefined();
  });

  it('should export CloudSyncStatus', () => {
    expect(componentsExports.CloudSyncStatus).toBeDefined();
  });

  it('should export CloudSyncButton', () => {
    expect(componentsExports.CloudSyncButton).toBeDefined();
  });

  it('should export ConnectGoogleDrive', () => {
    expect(componentsExports.ConnectGoogleDrive).toBeDefined();
  });
});
