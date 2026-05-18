# V2 Release TODO

Audit of design-v2 components for "this is an exploration" leftovers that need
to be decided before public release. Each item lists what is currently shipped,
why it is exploration-mode, and the options for closing it out.

## Already resolved in this branch

- **Multi-device sync toggle** in `settings.advanced` — removed (`AdvancedSection.tsx`).
  Was a `<ToggleRow on={false} onChange={() => {}}>` with no implementation.
  Locale keys `v2.settings.advanced.sync` / `v2.settings.advanced.syncHint`
  remain in `common.json` and are now unused; safe to delete when adding the
  next batch of locale strings.
- **Notification preferences wired into `generateDashboardAlerts`.** The four
  toggles in `NotificationsSection` (critical, lowStock, expiry, backup) now
  actually filter the dashboard alert pipeline. Added
  `useNotificationPrefs()` + `readNotificationPrefs()` in `@/features/alerts`
  and a `prefs` argument on `generateDashboardAlerts` that defaults to
  "everything on" so behaviour is preserved for existing users. `backup` is
  gated inside `useDashboardAlerts` (it does not flow through inventory
  generation).
- **Email digest panel removed** from `NotificationsSection.tsx`. The
  "Weekly summary" toggle and "Audit cadence: Monthly · 15th" read-field
  promised a feature with no backend. The functional Hidden-Alerts row was
  relocated into the In-App alerts panel. Locale keys `v2.settings.notifications.weekly*` /
  `v2.settings.notifications.audit*` / `v2.settings.notifications.emailHeader*`
  are now unused; safe to delete with the next locale batch.
- **`est:design:*` localStorage keys renamed** with one-shot migration:
  - `est:design:notification-prefs` → `est:notification-prefs`
  - `est:design:prefs` → `est:design-prefs`
  - `est:design:shopping-checked` → `est:shopping-checked`

  Each migration: on first read of the new key, copy the legacy value and
  delete the legacy key. Existing user state is preserved.

## Must address before release

### 1. `dashboard/v2/Plan.tsx` — static placeholder goal data

`GOAL_SEEDS` is a hand-authored array of eight "preparedness objectives" with
percentages (32 / 78 / 92 / 68 / 100 / 60 / 84 / 100) and free-text targets
(`"€500 small bills"`, `"21 L/person · 84 L total"`, etc.). Nothing reads
the user's actual inventory or household state — every user sees the same
numbers.

The Plan view is currently gated behind `settings.advanced.planView` (which
ships labelled "BETA / preview"), so it is not exposed by default. Options:

- **Recommended:** keep the BETA gate and document it as a roadmap feature,
  do not ship the Plan view in the release announcement, replace the static
  data before promoting the toggle out of beta.
- **Alternative:** remove the Plan view, the toggle, and the locale keys
  entirely, defer to a follow-up.

If the gate stays, also localise the `target` strings (they are currently
hard-coded English in `Plan.tsx` rather than in `common.json`).

## Nice-to-have before release

### 2. `alerts/v2/Alerts.tsx` — fake "today" date on every alert row

Each alert row shows today's date because the `Alert` type has no
`createdAt`. The component has a comment acknowledging this and the visual is
intentional for the "log" aesthetic. Production fix would be to add
`createdAt` to `Alert` and persist it.

Options:

- **Recommended:** leave as-is for release — the visual reads as a fresh
  status snapshot, not a falsified historical log. Add `createdAt` in a
  follow-up if real alert history becomes a requirement.

### 3. `onboarding/v2/OnboardStep06Complete.tsx` — hardcoded `value="0"` for readiness

The "all done" screen shows readiness as `0%` because no items have been
added during onboarding yet. Acceptable — it's literally accurate at that
moment — but could compute against the empty inventory + selected categories
for a less defeating zero. Cosmetic, defer.

## Cleanup follow-ups (post-release)

These do not block release but are worth tracking:

- **Unused locale keys**: `v2.settings.advanced.sync` /
  `v2.settings.advanced.syncHint` after the sync toggle removal.
- ~~**Voice abstraction**~~ — done. `useDesignTheme()` now returns only
  `{ themeKey }`; the static `VOICE` record was deleted from
  `voice.ts` and the last consumers (`DesignApp.tsx`, `Shell.tsx`,
  `StatusPill` in `primitives.tsx`) now use `t('v2.voice.<key>.<theme>')`.
- **FI translation quality pass**: The FI strings in `v2.*` were authored
  programmatically in one pass; a native-speaker review is recommended
  before the Finnish-language launch. Areas to focus on:
  - Cockpit/civil compound nouns (e.g. `VARMUUSKOPIOINTI­MUISTUTUKSET`,
    `ASIAKIRJAVARMUUSKOPIO`) — may read awkwardly.
  - Pantry-theme casual phrasing — should sound friendly, not stilted.

---

_Last updated as part of the design-v2 i18n migration. See branch
`design-update`._
