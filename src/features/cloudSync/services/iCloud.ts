/**
 * iCloud cloud storage provider implementation.
 *
 * Uses Apple's CloudKit JS SDK (loaded dynamically from Apple's CDN) to read
 * and write a single record in the user's *private* CloudKit database.
 *
 * Why a record, not a Drive file?
 *   CloudKit's data model is record-based, not file-based. We model the sync
 *   payload as one record of type `EmergencySupplyData` with:
 *     - recordName  : a fixed name `"sync-data"` so the record is unique.
 *     - data        : a String field holding the serialized JSON payload.
 *     - modified    : auto-managed by CloudKit (`record.modified.timestamp`).
 *   The same shape (id / modifiedTime / size) is exposed via
 *   {@link CloudFileMetadata} so the rest of the cloudSync layer treats this
 *   provider identically to Google Drive and OneDrive.
 */

import type {
  CloudStorageProvider,
  CloudFileMetadata,
  StoredTokens,
} from '../types';
import { CloudSyncError } from '../types';
import {
  storeTokens,
  getTokensForProvider,
  clearTokens,
  areTokensExpired,
} from './tokenStorage';

// CloudKit JS is loaded from Apple's CDN at runtime.
const CLOUDKIT_JS_URL = 'https://cdn.apple-cloudkit.com/ck/2/cloudkit.js';

// Static record name for the single sync record per user.
const SYNC_RECORD_NAME = 'sync-data';
const SYNC_RECORD_TYPE = 'EmergencySupplyData';

// CloudKit web auth tokens are valid for ~1 year by default. We track expiry
// only so the rest of the layer can treat tokens uniformly; CloudKit itself
// re-validates on every API call.
const DEFAULT_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;

// CloudKit JS minimal type surface. The real SDK exposes far more, but we
// only need these symbols. Declared as `unknown` shapes wrapped in helpers
// so the rest of the file stays type-safe without depending on @types
// declarations that Apple does not publish.

interface CKRecordField {
  value: string | number | boolean | null;
}

interface CKRecord {
  recordName: string;
  recordType: string;
  recordChangeTag?: string;
  modified?: { timestamp: number };
  fields: Record<string, CKRecordField>;
}

interface CKQueryResponse {
  records: CKRecord[];
}

interface CKDatabase {
  fetchRecords(recordNames: string[]): Promise<{ records: CKRecord[] }>;
  saveRecords(records: CKRecord[]): Promise<{ records: CKRecord[] }>;
  performQuery(query: { recordType: string }): Promise<CKQueryResponse>;
}

interface CKUserIdentity {
  userRecordName: string;
}

interface CKAuth {
  signIn?: () => Promise<CKUserIdentity>;
  signOut?: () => Promise<void>;
}

interface CKContainer {
  privateCloudDatabase: CKDatabase;
  fetchUserIdentity(): Promise<CKUserIdentity | null>;
  setUpAuth(): Promise<CKUserIdentity | null>;
}

interface CKConfig {
  containers: Array<{
    containerIdentifier: string;
    apiTokenAuth: { apiToken: string; persist?: boolean };
    environment: 'development' | 'production';
  }>;
}

interface CKApi {
  configure(config: CKConfig): void;
  getDefaultContainer(): CKContainer;
}

declare global {
  var CloudKit: CKApi | undefined;
}

let cloudKitScriptPromise: Promise<void> | null = null;

/**
 * Load CloudKit JS once (idempotent across calls).
 */
function loadCloudKitJs(): Promise<void> {
  if (globalThis.CloudKit) return Promise.resolve();
  if (cloudKitScriptPromise) return cloudKitScriptPromise;

  cloudKitScriptPromise = new Promise<void>((resolve, reject) => {
    const script = globalThis.document?.createElement('script');
    if (!script) {
      reject(
        new CloudSyncError(
          'CloudKit JS requires a browser environment',
          'AUTH_FAILED',
          false,
        ),
      );
      return;
    }
    script.src = CLOUDKIT_JS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      cloudKitScriptPromise = null;
      reject(
        new CloudSyncError(
          'Failed to load CloudKit JS. Check your internet connection.',
          'NETWORK_ERROR',
          true,
        ),
      );
    };
    globalThis.document!.head.appendChild(script);
  });

  return cloudKitScriptPromise;
}

/**
 * iCloud (CloudKit) implementation of CloudStorageProvider.
 */
export class ICloudService implements CloudStorageProvider {
  readonly providerId = 'icloud' as const;

  private container: CKContainer | null = null;

  /**
   * Initialise CloudKit JS (load script + configure container).
   * Throws when env vars are missing so the UI surfaces the misconfiguration.
   */
  private async getContainer(): Promise<CKContainer> {
    const containerId = import.meta.env.VITE_ICLOUD_CONTAINER_ID;
    const apiToken = import.meta.env.VITE_ICLOUD_API_TOKEN;
    const environment =
      (import.meta.env.VITE_ICLOUD_ENVIRONMENT as
        | 'development'
        | 'production'
        | undefined) ?? 'production';

    if (!containerId || !apiToken) {
      throw new CloudSyncError(
        'iCloud is not configured. Set VITE_ICLOUD_CONTAINER_ID and VITE_ICLOUD_API_TOKEN.',
        'AUTH_FAILED',
        false,
      );
    }

    if (this.container) return this.container;

    await loadCloudKitJs();

    if (!globalThis.CloudKit) {
      throw new CloudSyncError(
        'CloudKit JS unavailable after script load',
        'AUTH_FAILED',
        true,
      );
    }

    globalThis.CloudKit.configure({
      containers: [
        {
          containerIdentifier: containerId,
          apiTokenAuth: { apiToken, persist: true },
          environment,
        },
      ],
    });

    this.container = globalThis.CloudKit.getDefaultContainer();
    return this.container;
  }

  /**
   * Persist the CloudKit user identity as our shared "token" so the rest of
   * the cloudSync layer can read it uniformly. The real auth state lives in
   * CloudKit's own session cookies; we store the user record name as a
   * marker that we are connected.
   */
  private persistIdentity(identity: CKUserIdentity): void {
    const tokens: StoredTokens = {
      // CloudKit doesn't expose its session token to JS; use the user's
      // record name as a stable marker that we have an authenticated session.
      accessToken: identity.userRecordName,
      refreshToken: null,
      expiresAt: Date.now() + DEFAULT_TOKEN_TTL_MS,
      provider: 'icloud',
    };
    storeTokens(tokens);
  }

  /**
   * Connect to iCloud — opens Apple's Sign in with Apple flow.
   */
  async connect(): Promise<void> {
    if (this.isConnected() && !areTokensExpired()) {
      return;
    }

    try {
      const container = await this.getContainer();
      // setUpAuth resolves with the existing identity if already signed in,
      // or null if the user needs to click the SIWA button injected by
      // CloudKit JS. For programmatic connect, we then call signIn()
      // when available to trigger the flow.
      let identity = await container.setUpAuth();
      if (!identity) {
        // Some CloudKit JS versions expose `auth.signIn`; fall through to
        // poll setUpAuth if not.
        const ck = globalThis.CloudKit as CKApi & { auth?: CKAuth };
        if (ck.auth?.signIn) {
          identity = await ck.auth.signIn();
        } else {
          throw new CloudSyncError(
            'iCloud sign-in requires user interaction. Click the Sign in with Apple button.',
            'AUTH_FAILED',
            false,
          );
        }
      }
      this.persistIdentity(identity);
    } catch (error) {
      if (error instanceof CloudSyncError) throw error;
      throw new CloudSyncError(
        error instanceof Error ? error.message : 'iCloud authentication failed',
        'AUTH_FAILED',
        true,
      );
    }
  }

  /**
   * Disconnect from iCloud.
   */
  async disconnect(): Promise<void> {
    try {
      const ck = globalThis.CloudKit as (CKApi & { auth?: CKAuth }) | undefined;
      if (ck?.auth?.signOut) {
        await ck.auth.signOut();
      }
    } catch {
      // Ignore — we still clear local tokens below.
    }

    clearTokens();
    this.container = null;
  }

  /**
   * Check if connected with valid tokens.
   */
  isConnected(): boolean {
    const tokens = getTokensForProvider('icloud');
    return tokens !== null && !areTokensExpired();
  }

  /**
   * CloudKit doesn't issue access tokens consumable from JS — auth is via
   * session cookies inside the CloudKit JS instance. We expose the cached
   * userRecordName so callers can detect "connected" status uniformly.
   */
  async getAccessToken(): Promise<string | null> {
    const tokens = getTokensForProvider('icloud');
    return tokens?.accessToken ?? null;
  }

  /**
   * Find existing sync record. Returns the recordName as the file ID.
   */
  async findSyncFile(): Promise<string | null> {
    try {
      const container = await this.getContainer();
      const result = await container.privateCloudDatabase.fetchRecords([
        SYNC_RECORD_NAME,
      ]);
      const record = result.records[0];
      if (!record) return null;
      return record.recordName;
    } catch (error) {
      if (error instanceof CloudSyncError) throw error;
      // CloudKit returns a "record not found" error when the record doesn't
      // exist yet — treat as "not found" rather than an error.
      const code = (error as { ckErrorCode?: string }).ckErrorCode;
      if (code === 'RECORD_NOT_FOUND' || code === 'NOT_FOUND') return null;
      throw new CloudSyncError(
        'Failed to query iCloud for sync record',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  /**
   * Upload data by saving the record (creates or updates).
   * Always uses the fixed `SYNC_RECORD_NAME`; the `existingFileId` argument
   * is accepted for interface compatibility but not used.
   */
  async upload(data: string, _existingFileId?: string): Promise<string> {
    try {
      const container = await this.getContainer();
      const record: CKRecord = {
        recordName: SYNC_RECORD_NAME,
        recordType: SYNC_RECORD_TYPE,
        fields: {
          data: { value: data },
        },
      };
      const result = await container.privateCloudDatabase.saveRecords([record]);
      const saved = result.records[0];
      return saved?.recordName ?? SYNC_RECORD_NAME;
    } catch (error) {
      if (error instanceof CloudSyncError) throw error;
      const code = (error as { ckErrorCode?: string }).ckErrorCode;
      if (
        code === 'AUTHENTICATION_REQUIRED' ||
        code === 'AUTHENTICATION_FAILED'
      ) {
        throw new CloudSyncError(
          'iCloud authentication expired',
          'TOKEN_EXPIRED',
          true,
        );
      }
      if (code === 'QUOTA_EXCEEDED') {
        throw new CloudSyncError(
          'iCloud storage quota exceeded',
          'QUOTA_EXCEEDED',
          false,
        );
      }
      throw new CloudSyncError(
        'Failed to save sync record to iCloud',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  /**
   * Download record content.
   */
  async download(_fileId: string): Promise<string> {
    try {
      const container = await this.getContainer();
      const result = await container.privateCloudDatabase.fetchRecords([
        SYNC_RECORD_NAME,
      ]);
      const record = result.records[0];
      if (!record) {
        throw new CloudSyncError(
          'Sync record not found in iCloud',
          'FILE_NOT_FOUND',
          false,
        );
      }
      const value = record.fields.data?.value;
      if (typeof value !== 'string') {
        throw new CloudSyncError(
          'iCloud sync record is malformed',
          'PARSE_ERROR',
          false,
        );
      }
      return value;
    } catch (error) {
      if (error instanceof CloudSyncError) throw error;
      throw new CloudSyncError(
        'Failed to download data from iCloud',
        'NETWORK_ERROR',
        true,
      );
    }
  }

  /**
   * Get record metadata.
   */
  async getFileMetadata(_fileId: string): Promise<CloudFileMetadata | null> {
    try {
      const container = await this.getContainer();
      const result = await container.privateCloudDatabase.fetchRecords([
        SYNC_RECORD_NAME,
      ]);
      const record = result.records[0];
      if (!record) return null;

      const dataValue = record.fields.data?.value;
      const size = typeof dataValue === 'string' ? dataValue.length : undefined;

      return {
        id: record.recordName,
        name: SYNC_RECORD_NAME,
        modifiedTime: record.modified?.timestamp
          ? new Date(record.modified.timestamp).toISOString()
          : new Date().toISOString(),
        size,
      };
    } catch (error) {
      if (error instanceof CloudSyncError && error.code === 'FILE_NOT_FOUND') {
        return null;
      }
      const code = (error as { ckErrorCode?: string }).ckErrorCode;
      if (code === 'RECORD_NOT_FOUND' || code === 'NOT_FOUND') return null;
      throw error;
    }
  }
}
