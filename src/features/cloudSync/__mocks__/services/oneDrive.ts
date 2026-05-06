/**
 * Mock OneDrive service for tests.
 */

import type { CloudStorageProvider, CloudFileMetadata } from '../../types';

export class OneDriveService implements CloudStorageProvider {
  readonly providerId = 'onedrive' as const;

  async connect(): Promise<void> {
    // No-op for mock
  }

  async disconnect(): Promise<void> {
    // No-op for mock
  }

  isConnected(): boolean {
    return false;
  }

  async getAccessToken(): Promise<string | null> {
    return null;
  }

  async upload(_data: string, _existingFileId?: string): Promise<string> {
    return 'mock-onedrive-file-id';
  }

  async download(_fileId: string): Promise<string> {
    return '{}';
  }

  async getFileMetadata(_fileId: string): Promise<CloudFileMetadata | null> {
    return null;
  }

  async findSyncFile(): Promise<string | null> {
    return null;
  }
}
