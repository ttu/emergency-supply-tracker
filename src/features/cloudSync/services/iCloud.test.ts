/**
 * @vitest-environment jsdom
 *
 * Tests for ICloudService.
 *
 * We bypass the CloudKit JS dynamic-script load by injecting a fake
 * `globalThis.CloudKit` before each test. tokenStorage is mocked the same
 * way as the other providers' tests.
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

vi.stubEnv('VITE_ICLOUD_CONTAINER_ID', 'iCloud.test.container');
vi.stubEnv('VITE_ICLOUD_API_TOKEN', 'test-api-token');
vi.stubEnv('VITE_ICLOUD_ENVIRONMENT', 'development');

import { ICloudService } from './iCloud';

interface FakeContainer {
  privateCloudDatabase: {
    fetchRecords: Mock;
    saveRecords: Mock;
    performQuery: Mock;
  };
  fetchUserIdentity: Mock;
  setUpAuth: Mock;
}

function installFakeCloudKit(): {
  container: FakeContainer;
  configure: Mock;
  signIn: Mock;
  signOut: Mock;
} {
  const container: FakeContainer = {
    privateCloudDatabase: {
      fetchRecords: vi.fn(),
      saveRecords: vi.fn(),
      performQuery: vi.fn(),
    },
    fetchUserIdentity: vi.fn(),
    setUpAuth: vi.fn(),
  };

  const configure = vi.fn();
  const signIn = vi.fn();
  const signOut = vi.fn();

  (
    globalThis as typeof globalThis & {
      CloudKit?: unknown;
    }
  ).CloudKit = {
    configure,
    getDefaultContainer: () => container,
    auth: { signIn, signOut },
  } as unknown as typeof globalThis.CloudKit;

  return { container, configure, signIn, signOut };
}

describe('ICloudService', () => {
  let service: ICloudService;
  let fake: ReturnType<typeof installFakeCloudKit>;

  beforeEach(() => {
    vi.clearAllMocks();
    fake = installFakeCloudKit();

    (tokenStorage.getTokensForProvider as Mock).mockReturnValue({
      accessToken: 'user-record-name-123',
      refreshToken: null,
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      provider: 'icloud',
    });
    (tokenStorage.areTokensExpired as Mock).mockReturnValue(false);

    service = new ICloudService();
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { CloudKit?: unknown }).CloudKit;
  });

  describe('connect', () => {
    it('returns immediately when already connected with valid tokens', async () => {
      await service.connect();
      expect(fake.configure).not.toHaveBeenCalled();
    });

    it('configures CloudKit and persists identity from setUpAuth', async () => {
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      fake.container.setUpAuth.mockResolvedValue({
        userRecordName: 'user-abc',
      });

      await service.connect();

      expect(fake.configure).toHaveBeenCalledWith(
        expect.objectContaining({
          containers: expect.arrayContaining([
            expect.objectContaining({
              containerIdentifier: 'iCloud.test.container',
            }),
          ]),
        }),
      );
      expect(tokenStorage.storeTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'user-abc',
          provider: 'icloud',
        }),
      );
    });

    it('falls back to auth.signIn when setUpAuth returns null', async () => {
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      fake.container.setUpAuth.mockResolvedValue(null);
      fake.signIn.mockResolvedValue({ userRecordName: 'user-xyz' });

      await service.connect();

      expect(fake.signIn).toHaveBeenCalled();
      expect(tokenStorage.storeTokens).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'user-xyz' }),
      );
    });

    it('throws AUTH_FAILED when env vars are missing', async () => {
      vi.stubEnv('VITE_ICLOUD_CONTAINER_ID', '');
      (tokenStorage.areTokensExpired as Mock).mockReturnValue(true);
      const freshService = new ICloudService();

      await expect(freshService.connect()).rejects.toBeInstanceOf(
        CloudSyncError,
      );

      vi.stubEnv('VITE_ICLOUD_CONTAINER_ID', 'iCloud.test.container');
    });
  });

  describe('disconnect', () => {
    it('calls auth.signOut and clears tokens', async () => {
      fake.signOut.mockResolvedValue(undefined);
      await service.disconnect();
      expect(fake.signOut).toHaveBeenCalled();
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('still clears tokens when signOut fails', async () => {
      fake.signOut.mockRejectedValue(new Error('signout fail'));
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

  describe('findSyncFile', () => {
    it('returns recordName when sync record exists', async () => {
      fake.container.privateCloudDatabase.fetchRecords.mockResolvedValue({
        records: [
          {
            recordName: 'sync-data',
            recordType: 'EmergencySupplyData',
            fields: { data: { value: '{}' } },
          },
        ],
      });

      const id = await service.findSyncFile();
      expect(id).toBe('sync-data');
    });

    it('returns null when no record exists', async () => {
      fake.container.privateCloudDatabase.fetchRecords.mockResolvedValue({
        records: [],
      });

      const id = await service.findSyncFile();
      expect(id).toBeNull();
    });

    it('returns null when CloudKit reports RECORD_NOT_FOUND', async () => {
      const err = Object.assign(new Error('not found'), {
        ckErrorCode: 'RECORD_NOT_FOUND',
      });
      fake.container.privateCloudDatabase.fetchRecords.mockRejectedValue(err);

      const id = await service.findSyncFile();
      expect(id).toBeNull();
    });
  });

  describe('upload', () => {
    it('saves record with data field and returns the recordName', async () => {
      fake.container.privateCloudDatabase.saveRecords.mockResolvedValue({
        records: [
          {
            recordName: 'sync-data',
            recordType: 'EmergencySupplyData',
            fields: { data: { value: '{"x":1}' } },
            recordChangeTag: 'tag-1',
          },
        ],
      });

      const id = await service.upload('{"x":1}');

      expect(id).toBe('sync-data');
      const [records] =
        fake.container.privateCloudDatabase.saveRecords.mock.calls[0];
      expect(records[0]).toMatchObject({
        recordName: 'sync-data',
        recordType: 'EmergencySupplyData',
        fields: { data: { value: '{"x":1}' } },
      });
    });

    it('maps AUTHENTICATION_REQUIRED to TOKEN_EXPIRED', async () => {
      const err = Object.assign(new Error('auth req'), {
        ckErrorCode: 'AUTHENTICATION_REQUIRED',
      });
      fake.container.privateCloudDatabase.saveRecords.mockRejectedValue(err);

      await expect(service.upload('{}')).rejects.toMatchObject({
        code: 'TOKEN_EXPIRED',
      });
    });

    it('maps QUOTA_EXCEEDED', async () => {
      const err = Object.assign(new Error('quota'), {
        ckErrorCode: 'QUOTA_EXCEEDED',
      });
      fake.container.privateCloudDatabase.saveRecords.mockRejectedValue(err);

      await expect(service.upload('{}')).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
      });
    });
  });

  describe('download', () => {
    it('returns the data field from the fetched record', async () => {
      fake.container.privateCloudDatabase.fetchRecords.mockResolvedValue({
        records: [
          {
            recordName: 'sync-data',
            recordType: 'EmergencySupplyData',
            fields: { data: { value: '{"hello":"world"}' } },
          },
        ],
      });

      const content = await service.download('sync-data');
      expect(content).toBe('{"hello":"world"}');
    });

    it('throws FILE_NOT_FOUND when record is missing', async () => {
      fake.container.privateCloudDatabase.fetchRecords.mockResolvedValue({
        records: [],
      });

      await expect(service.download('sync-data')).rejects.toMatchObject({
        code: 'FILE_NOT_FOUND',
      });
    });

    it('throws PARSE_ERROR when data field has wrong type', async () => {
      fake.container.privateCloudDatabase.fetchRecords.mockResolvedValue({
        records: [
          {
            recordName: 'sync-data',
            recordType: 'EmergencySupplyData',
            fields: { data: { value: 42 } },
          },
        ],
      });

      await expect(service.download('sync-data')).rejects.toMatchObject({
        code: 'PARSE_ERROR',
      });
    });
  });

  describe('getFileMetadata', () => {
    it('returns metadata mapped from CloudKit record', async () => {
      const ts = Date.UTC(2026, 4, 5, 10, 0, 0);
      fake.container.privateCloudDatabase.fetchRecords.mockResolvedValue({
        records: [
          {
            recordName: 'sync-data',
            recordType: 'EmergencySupplyData',
            modified: { timestamp: ts },
            fields: { data: { value: '{"x":1}' } },
          },
        ],
      });

      const meta = await service.getFileMetadata('sync-data');
      expect(meta).toEqual({
        id: 'sync-data',
        name: 'sync-data',
        modifiedTime: new Date(ts).toISOString(),
        size: 7,
      });
    });

    it('returns null when record not found', async () => {
      fake.container.privateCloudDatabase.fetchRecords.mockResolvedValue({
        records: [],
      });

      const meta = await service.getFileMetadata('sync-data');
      expect(meta).toBeNull();
    });
  });
});
