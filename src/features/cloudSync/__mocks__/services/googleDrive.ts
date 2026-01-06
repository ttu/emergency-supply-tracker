/**
 * Mock Google Drive service for tests.
 */

import type { CloudStorageProvider, CloudFileMetadata } from '../../types';

export class GoogleDriveService implements CloudStorageProvider {
  readonly providerId = 'google-drive' as const;

  async connect(): Promise<void> {
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  isConnected(): boolean {
    return false;
  }

  async getAccessToken(): Promise<string | null> {
    return null;
  }

  async upload(_data: string, _existingFileId?: string): Promise<string> {
    return 'mock-file-id';
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
