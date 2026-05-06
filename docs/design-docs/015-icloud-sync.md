# iCloud Sync

Adds Apple iCloud as the third cloud sync provider, alongside Google Drive and Microsoft OneDrive. Users sign in with their Apple ID; sync data is stored as a single record in the user's _private_ CloudKit database. The app cannot read any other iCloud data.

## Architecture

iCloud plugs into the existing `CloudStorageProvider` abstraction:

```
src/features/cloudSync/
├── services/
│   ├── googleDrive.ts         # existing
│   ├── oneDrive.ts            # existing
│   ├── iCloud.ts              # NEW — CloudKit JS + private DB
│   ├── tokenStorage.ts        # shared
│   └── cloudStorageProvider.ts  # registers all three providers
├── components/
│   ├── ConnectGoogleDrive.tsx
│   ├── ConnectOneDrive.tsx
│   ├── ConnectICloud.tsx      # NEW — mirror component
│   └── CloudSyncSection.tsx   # provider chooser shows all three
└── types.ts                   # CloudProvider = 'google-drive' | 'onedrive' | 'icloud'
```

Only one provider is active at a time. Switching providers means disconnect → reconnect.

## CloudKit data model

CloudKit is record-based, not file-based. We model the sync payload as one record:

| Field        | Type                       | Purpose                                                                 |
| ------------ | -------------------------- | ----------------------------------------------------------------------- |
| `recordType` | `EmergencySupplyData`      | Schema name                                                             |
| `recordName` | `sync-data` (fixed)        | Stable identifier so the record is unique per user                      |
| `data`       | `String`                   | Serialized JSON payload (the same blob other providers store as a file) |
| `modified`   | (auto-managed by CloudKit) | Used as `modifiedTime` for last-write-wins comparison                   |

The same shape (id / modifiedTime / size) is exposed via `CloudFileMetadata`, so the rest of the cloudSync layer treats this provider identically to the others.

## CloudKit JS

CloudKit JS is loaded **dynamically from Apple's CDN** (`https://cdn.apple-cloudkit.com/ck/2/cloudkit.js`) — there is no npm package. `iCloud.ts` injects a `<script>` tag once and caches the load promise. After the script loads, we call:

- `CloudKit.configure({ containers: [...] })` — once per session
- `container.setUpAuth()` — resolves the existing identity, or `null` if the user must click _Sign in with Apple_
- `container.privateCloudDatabase.fetchRecords(['sync-data'])` — read
- `container.privateCloudDatabase.saveRecords([record])` — create / replace

Auth state lives inside CloudKit JS's session cookies. We mirror the user's `userRecordName` into our shared `tokenStorage` so the rest of the layer can call `isConnected()` uniformly. The mirrored "token" is a marker, not a credential — actual auth is enforced by Apple on every API call.

Errors from CloudKit JS carry a `ckErrorCode` field that we map to our `CloudSyncErrorCode` union: `AUTHENTICATION_REQUIRED` → `TOKEN_EXPIRED`, `RECORD_NOT_FOUND`/`NOT_FOUND` → null/`FILE_NOT_FOUND`, `QUOTA_EXCEEDED` → `QUOTA_EXCEEDED`.

## Setup: Apple Developer + CloudKit Console

iCloud sync is **not free** — it requires an active Apple Developer Program membership ($99/year).

1. **Apple Developer Program**: enroll at <https://developer.apple.com/programs/>. Wait for approval (a few hours to a day).
2. **CloudKit container**: open the [CloudKit Console](https://icloud.developer.apple.com/dashboard) and create a container. The identifier must start with `iCloud.`, e.g. `iCloud.fi.72tuntia.app`.
3. **Schema**: in **Schema → Record Types**, add `EmergencySupplyData` with one custom field:
   - `data` — type _String_, queryable not required.
4. **Web API token**: in **API Tokens**, click _New Token_ → _Web Services_. Add allowed origins for every domain that will use iCloud sync:
   - `http://localhost:5173` (dev)
   - `https://72tuntia.fi` (prod)
   - any staging hosts
     Copy the generated token.
5. **Environment**: CloudKit has separate _development_ and _production_ environments. Use `development` while iterating on the schema; promote it via the dashboard before going to `production`.
6. **`.env.local`**:
   ```
   VITE_ICLOUD_CONTAINER_ID=iCloud.fi.72tuntia.app
   VITE_ICLOUD_API_TOKEN=<the web API token>
   VITE_ICLOUD_ENVIRONMENT=production
   ```
7. **Sign in with Apple** is configured automatically when the container is created — no separate Apple ID app registration is needed for the JS web flow.

## What we don't do

- **No multi-device push notifications.** CloudKit supports record subscriptions and push, but we currently do manual sync only. A subscription that triggers `syncNow()` when another device updates the record is a natural follow-up.
- **No conflict resolution beyond last-write-wins.** CloudKit gives us `recordChangeTag` for optimistic concurrency, but `performSync` already uses timestamp-based last-write-wins to stay consistent across providers. We accept the same trade-off here.
- **No iOS/macOS-app integration.** This is a web-only path. A native companion app could share the same CloudKit container (same `containerIdentifier`) and the records would be visible from both — but that is out of scope.

## Testing

`iCloud.test.ts` mocks `tokenStorage` and injects a fake `globalThis.CloudKit`, exercising:

- Connect (existing identity, fallback to `auth.signIn`, missing env vars)
- Disconnect (sign-out success, sign-out failure still clears tokens)
- `isConnected` across token states
- `findSyncFile` (record present, empty result, RECORD_NOT_FOUND)
- `upload` (saves record, AUTHENTICATION_REQUIRED → `TOKEN_EXPIRED`, QUOTA_EXCEEDED)
- `download` (returns `data` field, missing record → `FILE_NOT_FOUND`, wrong field type → `PARSE_ERROR`)
- `getFileMetadata` (mapped CloudKit fields, missing record returns `null`)

The provider chooser UI is covered by extended `CloudSyncSection` tests verifying that all three connect components render when disconnected and that the correct provider's disconnect appears when connected.
