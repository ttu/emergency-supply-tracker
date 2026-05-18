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

### 2. `settings/v2/NotificationsSection.tsx` — toggles do nothing

The in-app alerts panel exposes four toggles — `critical`, `lowStock`,
`expiry`, `backup` — and persists them to `localStorage` under
`est:design:notification-prefs`. **No consumer reads the value.**
`generateDashboardAlerts()` produces alerts regardless of these prefs, so the
toggles are decorative.

Options:

- **Recommended:** wire the prefs into `generateDashboardAlerts` (filter the
  output by alert category against `Prefs`). Inexpensive change. Ensure
  defaults remain `true` so behaviour is preserved for existing users.
- **Alternative:** delete the panel for the release; reintroduce when the
  alerts pipeline supports per-category opt-out.

### 3. `settings/v2/NotificationsSection.tsx` — email digest with no backend

Same panel renders a "Weekly summary" toggle (`MON 09:00 EET`) and an "Audit
cadence" read-field (`Monthly · 15th`). There is no email backend in the
project at all (no API routes, no scheduled jobs, no SMTP config). These two
fields promise a feature that physically does not exist.

Options:

- **Recommended:** remove the entire `Email digest` panel from
  `NotificationsSection.tsx` (the `<Panel>` containing `weekly` /
  `audit` / `hidden`). Keep the `hidden` (dismissed alerts) row by relocating
  it to the in-app panel — that row works correctly.
- **Alternative:** leave the panel but label it `Email digest · coming soon`
  with the toggle disabled; same UX debt as the sync toggle we just removed.

## Nice-to-have before release

### 4. Storage-key prefix `est:design:*`

Three localStorage keys are prefixed with `design:` from when v2 was an
exploration:

- `est:design:notification-prefs` — `NotificationsSection.tsx`
- `est:design:prefs` — `useDesignPref.ts`
- `est:design:shopping-checked` — `Shopping.tsx`, `MobileShopping.tsx`

This is purely cosmetic; the keys work fine. Renaming requires a one-shot
migration to preserve existing user data. **Leave as-is for the release**
unless we do a broader localStorage cleanup at the same time.

### 5. `alerts/v2/Alerts.tsx` — fake "today" date on every alert row

Each alert row shows today's date because the `Alert` type has no
`createdAt`. The component has a comment acknowledging this and the visual is
intentional for the "log" aesthetic. Production fix would be to add
`createdAt` to `Alert` and persist it.

Options:

- **Recommended:** leave as-is for release — the visual reads as a fresh
  status snapshot, not a falsified historical log. Add `createdAt` in a
  follow-up if real alert history becomes a requirement.

### 6. `onboarding/v2/OnboardStep06Complete.tsx` — hardcoded `value="0"` for readiness

The "all done" screen shows readiness as `0%` because no items have been
added during onboarding yet. Acceptable — it's literally accurate at that
moment — but could compute against the empty inventory + selected categories
for a less defeating zero. Cosmetic, defer.

## Cleanup follow-ups (post-release)

These do not block release but are worth tracking:

- **Unused locale keys**: `v2.settings.advanced.sync` /
  `v2.settings.advanced.syncHint` after the sync toggle removal.
- **Voice abstraction**: `useDesignTheme()` still returns a `voice` object
  that no v2 component consumes (every voice reference now uses
  `t('v2.voice.<key>.<theme>')`). The `voice.ts` `VOICE` static record is
  effectively dead code; safe to delete with a small `useDesignTheme.ts`
  trim. Punted from the i18n migration to keep that diff focused.
- **FI translation quality pass**: The FI strings in `v2.*` were authored
  programmatically in one pass; a native-speaker review is recommended
  before the Finnish-language launch. Areas to focus on:
  - Cockpit/civil compound nouns (e.g. `VARMUUSKOPIOINTI­MUISTUTUKSET`,
    `ASIAKIRJAVARMUUSKOPIO`) — may read awkwardly.
  - Pantry-theme casual phrasing — should sound friendly, not stilted.

---

_Last updated as part of the design-v2 i18n migration. See branch
`design-update`._
