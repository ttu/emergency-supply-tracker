import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerProvider,
  getProvider,
  getAvailableProviders,
  isProviderAvailable,
  initializeProviders,
  resetProviders,
} from './cloudStorageProvider';
import type { CloudStorageProvider } from '../types';

// Mock GoogleDriveService to avoid loading actual Google API
vi.mock('./googleDrive', () => ({
  GoogleDriveService: vi.fn().mockImplementation(() => ({
    providerId: 'google-drive',
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    getAccessToken: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    getFileMetadata: vi.fn(),
    findSyncFile: vi.fn(),
  })),
}));

describe('cloudStorageProvider', () => {
  beforeEach(() => {
    resetProviders();
  });

  describe('registerProvider', () => {
    it('should register a provider factory', () => {
      const mockFactory = vi.fn(() => ({
        providerId: 'google-drive',
      })) as unknown as () => CloudStorageProvider;

      registerProvider('google-drive', mockFactory);

      expect(isProviderAvailable('google-drive')).toBe(true);
    });
  });

  describe('getProvider', () => {
    it('should return provider instance from factory', () => {
      const mockProvider = {
        providerId: 'google-drive',
      } as CloudStorageProvider;
      const mockFactory = vi.fn(() => mockProvider);

      registerProvider('google-drive', mockFactory);

      const result = getProvider('google-drive');

      expect(result).toBe(mockProvider);
      expect(mockFactory).toHaveBeenCalled();
    });

    it('should return null for unregistered provider', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = getProvider('google-drive');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cloud provider not registered: google-drive',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getAvailableProviders', () => {
    it('should return empty array when no providers registered', () => {
      expect(getAvailableProviders()).toEqual([]);
    });

    it('should return array of registered provider IDs', () => {
      const mockFactory = vi.fn() as unknown as () => CloudStorageProvider;
      registerProvider('google-drive', mockFactory);

      expect(getAvailableProviders()).toEqual(['google-drive']);
    });
  });

  describe('isProviderAvailable', () => {
    it('should return false for unregistered provider', () => {
      expect(isProviderAvailable('google-drive')).toBe(false);
    });

    it('should return true for registered provider', () => {
      const mockFactory = vi.fn() as unknown as () => CloudStorageProvider;
      registerProvider('google-drive', mockFactory);

      expect(isProviderAvailable('google-drive')).toBe(true);
    });
  });

  describe('initializeProviders', () => {
    it('should register Google Drive provider', () => {
      initializeProviders();

      expect(isProviderAvailable('google-drive')).toBe(true);
    });

    it('should return singleton instance for Google Drive', () => {
      initializeProviders();

      const instance1 = getProvider('google-drive');
      const instance2 = getProvider('google-drive');

      expect(instance1).toBe(instance2);
    });
  });

  describe('resetProviders', () => {
    it('should clear all registered providers', () => {
      initializeProviders();
      expect(isProviderAvailable('google-drive')).toBe(true);

      resetProviders();

      expect(isProviderAvailable('google-drive')).toBe(false);
      expect(getAvailableProviders()).toEqual([]);
    });

    it('should reset singleton instances', () => {
      initializeProviders();
      const instance1 = getProvider('google-drive');

      resetProviders();
      initializeProviders();

      const instance2 = getProvider('google-drive');

      // After reset, should create a new instance
      expect(instance1).not.toBe(instance2);
    });
  });
});
