# OneDrive Sync

Adds Microsoft OneDrive as a second cloud sync provider alongside Google Drive. Users sign in with a Microsoft account; sync data is stored in the app's dedicated OneDrive **app folder** (`/Apps/Emergency Supply Tracker/`), so the app never sees the user's wider OneDrive contents.

## Architecture

The provider layer was already abstracted via `CloudStorageProvider`. OneDrive plugs in alongside Google Drive:

```
src/features/cloudSync/
├── services/
│   ├── googleDrive.ts       # existing
│   ├── oneDrive.ts          # NEW — MSAL.js + Graph API
│   ├── tokenStorage.ts      # shared (provider-keyed)
│   └── cloudStorageProvider.ts  # registers both providers
├── components/
│   ├── ConnectGoogleDrive.tsx   # existing
│   ├── ConnectOneDrive.tsx      # NEW — mirror component
│   └── CloudSyncSection.tsx     # shows both choices when disconnected
└── types.ts                  # CloudProvider = 'google-drive' | 'onedrive'
```

The active provider is recorded in `CloudSyncConfig.provider`. Only one provider is connected at a time — the `tokenStorage` design stores a single set of tokens keyed by provider. Switching providers requires explicit disconnect + reconnect.

## Authentication: MSAL.js

OneDrive uses **`@azure/msal-browser`** with the **PKCE** flow (no client secret needed for SPAs):

- **Authority**: `https://login.microsoftonline.com/common` — accepts personal Microsoft accounts (`@outlook.com`, `@hotmail.com`, `@live.com`, etc.) and work/school accounts.
- **Scopes**: `Files.ReadWrite.AppFolder` — restricts file access to the app's own folder.
- **Cache**: `sessionStorage` (MSAL's own cache, separate from our `tokenStorage`). The access token is mirrored into our `tokenStorage` on login so the rest of the cloudSync layer treats both providers uniformly.
- **Silent refresh**: On token expiry, `acquireTokenSilent` is attempted. If MSAL throws `InteractionRequiredAuthError`, the user must reconnect via the UI.

## File operations: Microsoft Graph

| Operation | Endpoint |
|---|---|
| Find sync file | `GET /me/drive/special/approot/children?$select=id,name,lastModifiedDateTime` |
| Upload (new) | `PUT /me/drive/special/approot:/{filename}:/content` |
| Upload (update) | `PUT /me/drive/items/{id}/content` |
| Download | `GET /me/drive/items/{id}/content` |
| Metadata | `GET /me/drive/items/{id}?$select=id,name,lastModifiedDateTime,size` |

Graph supports plain `PUT` for content uploads — no multipart envelope needed (simpler than Google Drive's multipart create). Errors are mapped to `CloudSyncErrorCode` the same way as Google Drive: 401 → `TOKEN_EXPIRED`, 403 → `PERMISSION_DENIED`, 404 → `FILE_NOT_FOUND`, 507/509 → `QUOTA_EXCEEDED`.

## Setup: Azure App Registration

To enable OneDrive sync in a deployment, register an app in Azure:

1. Go to <https://portal.azure.com/> → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. **Name**: e.g. `Emergency Supply Tracker`.
3. **Supported account types**: choose one:
   - *Personal Microsoft accounts only* — simplest; works with `outlook.com`, `hotmail.com`, etc.
   - *Accounts in any organizational directory and personal Microsoft accounts* — required if you want work/school accounts too. Use the matching authority (`common`) — already configured in `oneDrive.ts`.
4. **Redirect URI**: select platform **Single-page application (SPA)** and add:
   - `http://localhost:5173` (dev)
   - The production URL, e.g. `https://72tuntia.fi`
   - Any staging URLs
5. After creation, go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions** → check `Files.ReadWrite.AppFolder`. (`User.Read` is added automatically for sign-in.)
6. Click **Grant admin consent** if you registered under an organization (not needed for personal-only registrations).
7. From the app's **Overview** page, copy the **Application (client) ID** into `.env.local`:
   ```
   VITE_MICROSOFT_CLIENT_ID=00000000-0000-0000-0000-000000000000
   ```
8. (Optional) Under **Authentication** → **Implicit grant and hybrid flows**, leave both checkboxes **off**. PKCE does not require them, and disabling them is the recommended hardening.

The app folder (`/Apps/Emergency Supply Tracker/`) is created automatically on the first upload; no admin setup required.

## What we don't do

- **Refresh tokens are not stored locally**. MSAL keeps them in its own session cache; we only mirror the short-lived access token into `tokenStorage`. This trades smoother resumption for not having long-lived secrets sitting in `localStorage`.
- **No cross-provider migration.** If the user disconnects Google Drive and connects OneDrive, no data is transferred between drives. Local data is the source of truth, so the next sync uploads it.
- **No multi-account on the same provider.** MSAL supports multiple accounts; our state model assumes one. Adding it would be a follow-up.

## Testing

`oneDrive.test.ts` mocks `@azure/msal-browser` and `tokenStorage` and exercises:
- Connect / cancel / missing-client-ID
- Disconnect (cache clear, even when MSAL clearCache fails)
- `isConnected` across token states
- `getAccessToken` happy path + silent refresh + interaction-required
- Find / upload (new + update) / download / metadata
- Error mapping (401 / 404 / 507)

The provider chooser UI is covered by existing `CloudSyncSection` integration tests (extended for the OneDrive button).
