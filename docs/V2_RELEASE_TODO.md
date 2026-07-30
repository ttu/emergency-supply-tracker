# V2 Release TODO

Living checklist of what's left before the design-v2 surface can be released.
What landed already is summarised at the bottom; the rest of the doc is the
pending work, ordered by decision urgency.

---

## 🔴 Blocking — decide before release

_Nothing open._ The Plan-view question (static `GOAL_SEEDS` placeholder data)
was settled by the design update: navigation collapsed to the app's four real
pages, so the Plan view, its BETA toggle and its `v2.plan.*` locale keys were
removed outright. See "Navigation reduced to four destinations" below.

---

## 🟡 Deferred — accepted as-is for v1.0, track for follow-up

### 1. `onboarding/v2/OnboardStep06Complete.tsx` — readiness hardcoded `0%`

The end-of-onboarding screen shows `0%` readiness because no items have been
added yet. Literally accurate at that moment; could compute against the
empty inventory + selected categories for a less defeating zero. Cosmetic.

---

## 🧹 Post-release cleanup (no rush, but don't lose track)

### Unused locale keys after this branch's cleanups

These keys exist in `public/locales/{en,fi}/common.json` but no component
reads them any more. Safe to delete in the next locale-cleanup batch:

| Key                                               | Why unused                                            |
| ------------------------------------------------- | ----------------------------------------------------- |
| `v2.settings.advanced.sync` / `syncHint`          | Multi-device sync toggle removed (no implementation)  |
| `v2.settings.notifications.emailHeader`           | Email-digest panel removed (no backend)               |
| `v2.settings.notifications.weekly` / `weeklyHint` | Same                                                  |
| `v2.settings.notifications.audit` / `auditValue`  | Same                                                  |
| `v2.settings.recommendations.importBtn`           | Dead-end Import button removed (use §7.4 Custom kits) |
| `v2.settings.recommendations.importAlert`         | Same                                                  |

### FI translation quality pass

The `v2.*` Finnish strings were authored programmatically in one pass.
Native-speaker review recommended before the Finnish-language launch — focus
on:

- Cockpit/civil compound nouns (e.g. `VARMUUSKOPIOINTI­MUISTUTUKSET`,
  `ASIAKIRJAVARMUUSKOPIO`) — may read awkwardly in caps.
- Pantry-theme casual phrasing — should sound friendly, not stilted.

---

## ✅ Resolved on this branch

(Summary for context — full detail in git log.)

- **Navigation reduced to four destinations** — the design update aligned v2
  with the real app: Overview, Inventory, Help, Settings. Alerts moved onto
  the dashboard as a dismissable banner (`alerts/v2/AlertBanner.tsx`,
  mirroring v1's `AlertBanner`); the shopping list is an export under
  Settings → Data & backup; the Plan view is gone. The `Alerts`,
  `MobileAlerts`, `Shopping`, `MobileShopping` and `Plan` page components,
  the Plan BETA toggle, the `planViewBeta` design pref and the now-orphaned
  `v2.plan.*` / `v2.shopping.*` / `v2.alerts.*` (except `dismiss`) /
  `v2.voice.{plan,shopping}` locale keys were all deleted.
- **Design-mindset stubs removed/wired** — Multi-device sync toggle (no
  implementation), Email digest panel (no backend), Recommendations Import
  button (dead-end alert) all removed. Notification preference toggles
  (critical / lowStock / expiry / backup) now actually filter
  `generateDashboardAlerts`.
- **i18n migration complete** — every v2 user-facing string now goes through
  `t('v2.*')`. The `VOICE` static record was deleted; `useDesignTheme()`
  returns only `{ themeKey }`.
- **Status logic unified between v1 and v2** — `statusOf` delegates to the
  canonical `calculateItemStatus`. Fixes a latent timezone bug in v2's
  expiration math.
- **`est:design:*` localStorage keys renamed** with one-shot migration to
  preserve existing user state.
- **NotificationItem toasts themed** for v2 surfaces via
  `[data-theme='cockpit'|'civil'|'pantry']` CSS overrides.
- **Onboarding entry point unified behind `Suspense`** for parity with the
  v1 lazy-loaded surface.
- **Refactoring-expert audit follow-ups landed** — `Caption` deduped,
  `AccentTextButton` / `StatusBadge` / `CAPS_STYLE` primitives introduced,
  `useShoppingList` / `useItemDetailState` / `ItemNotFound` shared between
  desktop/mobile, `ALERT_TYPE_TO_DESIGN_STATUS` consolidated.
- **React-review fixes** — `useNotificationPrefs` functional updater (stale-
  closure fix), unhelpful `DesignApp` `useMemo`s dropped, `useShoppingList`
  open/done counts memoised, `MobileInventory`/`OnboardStep05Items` chip
  arrays memoised, `DataBackupSection` storage reads memoised on `items`
  change.
- **`window.confirm` replaced with themed `ConfirmDialog`** — new
  `design-v2/ConfirmDialog.tsx` primitive (portal, `role="alertdialog"`,
  focus trap, ESC, focus restore on close, v2 Panel + Button + danger
  tone). `useItemDetailState` now exposes the dialog state
  (`deleteConfirmOpen` / `deleteConfirmTitle` / `deleteConfirmMessage` /
  `deleteConfirmAction` / `confirmDelete` / `cancelDelete`); both
  `ItemDetail` and `MobileItemDetail` render the dialog inline.
- **Performance pass** — every long list row in v2 (`InventoryRow`,
  `AlertRow`, `MobileAlertRow`, `ShoppingListRow`, `MobileShoppingRow`,
  `MobileInventoryRow`) wrapped in `React.memo` with stable id-based
  callbacks; static style objects hoisted to module scope.

---

_Last updated 2026-05-20 — branch `design-update`._
