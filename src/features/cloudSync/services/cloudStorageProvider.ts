/**
 * Cloud storage provider abstraction.
 * This module provides factory functions for creating provider instances
 * and utilities for working with providers.
 */

import type { CloudProvider, CloudStorageProvider } from '../types';
import { GoogleDriveService } from './googleDrive';

// Registry of available providers
const providerRegistry: Map<CloudProvider, () => CloudStorageProvider> =
  new Map();

/**
 * Register a provider factory.
 * Call this during app initialization for each supported provider.
 */
export function registerProvider(
  providerId: CloudProvider,
  factory: () => CloudStorageProvider,
): void {
  providerRegistry.set(providerId, factory);
}

/**
 * Get a provider instance by ID.
 * Returns null if provider is not registered.
 */
export function getProvider(
  providerId: CloudProvider,
): CloudStorageProvider | null {
  const factory = providerRegistry.get(providerId);
  if (!factory) {
    console.warn(`Cloud provider not registered: ${providerId}`);
    return null;
  }
  return factory();
}

/**
 * Get list of available provider IDs.
 */
export function getAvailableProviders(): CloudProvider[] {
  return Array.from(providerRegistry.keys());
}

/**
 * Check if a provider is available.
 */
export function isProviderAvailable(providerId: CloudProvider): boolean {
  return providerRegistry.has(providerId);
}

// Singleton instance for Google Drive
let googleDriveInstance: GoogleDriveService | null = null;

/**
 * Initialize the provider registry with available providers.
 * Call this during app startup.
 */
export function initializeProviders(): void {
  // Register Google Drive provider
  registerProvider('google-drive', () => {
    if (!googleDriveInstance) {
      googleDriveInstance = new GoogleDriveService();
    }
    return googleDriveInstance;
  });

  // Future: Register OneDrive, Dropbox, etc.
  // registerProvider('onedrive', () => new OneDriveService());
  // registerProvider('dropbox', () => new DropboxService());
}

/**
 * Reset provider instances (useful for testing).
 */
export function resetProviders(): void {
  googleDriveInstance = null;
  providerRegistry.clear();
}
