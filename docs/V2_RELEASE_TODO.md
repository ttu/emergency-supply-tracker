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

The hardcoded `0%` readiness on the completion screen was resolved by the
quick-setup step: `OnboardComplete` now computes readiness from what was
actually seeded, so marking items owned during setup shows a non-zero figure.

### E2E findings from the CodeRabbit review (2026-08-04)

The review's test-correctness findings were fixed; these three groups were
judged too large to bolt onto this branch and are deliberately left open:

- **Five disabled axe rules** in `e2e/a11y.spec.ts` — `color-contrast`,
  `heading-order`, `region`, `scrollable-region-focusable` and
  `page-has-heading-one`. Enforcing them means changing v2 theme contrast,
  the heading hierarchy, landmark structure and the MobileShell page title,
  i.e. app code rather than tests. Worth its own PR.
- **Three skipped suites** — the import round-trip in `data-management.spec.ts`
  and the manual workflows in `smoke-quick-setup.spec.ts` /
  `smoke-manual-entry.spec.ts`. All were written against v1 flows and need V2
  replacements rather than un-skipping.
- **Mobile-viewport coverage** — `item-expiration`, `item-status`,
  `custom-categories`, `inventory` and `v2-actions` cover desktop only; the
  review asked for mobile variants of each.

Two DRY refactors were also suggested and skipped: extracting a
`seedStaleBackup` helper in `backup-reminder.spec.ts`, and moving the
duplicated `v2Settings` / `seedApp` definitions into `e2e/fixtures.ts`.

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

- **v1 parity gaps closed** — an audit against the classic shell found five
  things v2 could not do. Recommended items are now discoverable (a MISSING
  filter listing what the household owns none of, scaled to it); adding starts
  from a product template rather than a blank form; the inventory sorts by
  name/quantity/expiration and filters by location; and selecting a category
  shows what it requires, how the target is derived, and the per-item
  shortfall. Plan: `docs/plans/2026-07-31-v2-parity-gaps.md`.

- **Onboarding reaches parity with v1** — the design update added the two
  screens v2 was missing: a recommendation-kit chooser (`OnboardKit`,
  built-in kits plus JSON upload, on the existing `useRecommendedItems` kit
  API) and a quick-setup checklist (`OnboardQuickSetup`) listing the
  kit's products sized to the household, with per-line ticks, a "mark owned"
  pill, skip and demo-data escapes. The old category-toggle step is gone —
  per-item selection subsumes it. Seeding moved out of the completion screen
  into `buildOnboardingItems`, driven by that selection: ticked products start
  at 0, owned ones at their recommended quantity.

- **Native v2 product picker** — the add-item flow no longer wraps v1's
  `TemplateSelector` in `design-v2-embed`. `ProductPicker` draws the picker in
  the v2 language: search, a category rail of code + name chips, product rows
  with recommended amounts, and the custom-item escape.

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
  open/done counts memoised, `MobileInventory` and the then-current onboarding
  category step's chip arrays memoised, `DataBackupSection` storage reads
  memoised on `items` change.
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
