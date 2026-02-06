/**
 * Mock cloud storage provider for tests.
 */

import type { CloudProvider, CloudStorageProvider } from '../../types';
import { GoogleDriveService } from './googleDrive';

const providerRegistry: Map<CloudProvider, () => CloudStorageProvider> =
  new Map();

export function registerProvider(
  providerId: CloudProvider,
  factory: () => CloudStorageProvider,
): void {
  providerRegistry.set(providerId, factory);
}

export function getProvider(
  providerId: CloudProvider,
): CloudStorageProvider | null {
  const factory = providerRegistry.get(providerId);
  if (!factory) {
    return null;
  }
  return factory();
}

export function getAvailableProviders(): CloudProvider[] {
  return Array.from(providerRegistry.keys());
}

export function isProviderAvailable(providerId: CloudProvider): boolean {
  return providerRegistry.has(providerId);
}

export function initializeProviders(): void {
  registerProvider('google-drive', () => new GoogleDriveService());
}

export function resetProviders(): void {
  providerRegistry.clear();
}
