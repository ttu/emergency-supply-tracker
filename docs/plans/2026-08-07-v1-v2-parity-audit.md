# v1 vs v2 functional parity audit — 2026-08-07

Live-UI re-audit of design v2 (cockpit/civil/pantry) against v1 (classic
themes), on branch `design-update`. Screenshots:
`verification-sessions/20260807-145646-v1-v2-parity-audit/`.

**Status: all 6 findings closed (2026-08-08).** The initial pass was
report-only; a follow-up implemented fixes for items 1, 2, 4, 5, 6 and found
item 3 was a false positive (see "Resolution" at the end of each finding
below). Full `npm run validate` (3934 tests) and live-browser visual
verification passed after the changes.

## Method

Same household (2 adults, 1 child, 1 pet, 14-day target) and item set (5
items across water/food/medical/power, one 0-qty, one expiring soon, one
location-less, plus 5 random custom templates) loaded via localStorage into
both a v1 theme (`light`) and a v2 theme (`cockpit`), then walked page by
page in a real browser (Playwright), diffing behavior, not just code.

## Starting point

`docs/plans/2026-07-31-v2-parity-gaps.md` (2026-07-31) found 5 gaps: missing
recommended items, no template-based add, no sort, no location filter, no
category breakdown. **All five are now resolved** — confirmed live:
`MissingItemsTable`/`CategoryRecommendedPanel` surface missing recommended
items with Add actions; `ProductPicker` offers the full template catalog
(including custom templates) plus a custom-item escape hatch; sort and
location filters are in `InventoryFilterStrip`; and the category summary
panel (requirement breakdown, drinking/prep split, recommended-shortfall
list) is richer than v1's. That doc is stale and can be archived.

## New findings

### 1. No inline quantity quick-edit in the inventory list (moderate)

v1: clicking an item's quantity on its list/grid card reveals a `−`/`+`
stepper right there — no navigation needed. This was significant enough to
have its own design doc (`docs/plans/2026-02-12-quick-edit-item-quantity*`).

v2: the table/list row is a single link into the item detail page. Once
there, the OPS panel (`−1` / `+1` / `CONSUME`, writes immediately,
independent of form save) is actually a nicer control than v1's — but
reaching it costs a full page navigation per item. For the common "walk the
shelves and correct quantities" workflow, that's an extra click and a
round-trip per item instead of zero.

Evidence: `v1-inline-qty-edit.png`, `v2-item-detail.png`.

**Resolution:** added a compact `−`/qty/`+` stepper directly to
`InventoryRow` (desktop) and `MobileInventoryRow`, writing through
`useInventory().updateItem` immediately, no debounce (matching the item
detail OPS panel's "writes immediately" behavior). Converted both rows'
root element from `<button>` to `div[role="button"]` — nesting `<button>`
inside `<button>` is invalid HTML, and v1's own `ItemCard` documents the
same fix for the same reason. Evidence: `fix1-inline-stepper-desktop.png`,
`fix1-inline-stepper-mobile.png`.

### 2. v2's Help page has no app-usage/support content (significant)

v1 Help & FAQ covers: getting-started walkthrough, why household size
matters, what recommended items are, how expiration works, the category
list, the status-color legend, **how to back up data**, **where data is
stored**, **how to export a shopping list**, how the readiness score is
computed, quick tips, and contact links (support email + GitHub repo).

v2's Help page is a different thing entirely: a themed civil-preparedness
primer (§1 Purpose, §2 Water, §3 Food, §4 Light & Power, §5 Medical, §6 Docs
& Cash) — good content, but zero overlap with v1's. None of the app-usage
FAQ survived, and there's no backup/data-location explanation and no
contact/bug-report link on the page itself. Given the app still carries a
"we're still testing, report problems via email" banner, losing the
in-context support link is the sharper edge of this gap.

Evidence: `v1-help.png`, `v2-help.png`.

**Resolution:** added three new Guide sections (§7 Data & Backup, §8
Shopping List Export, §9 Readiness Score — themed titles, shared body copy,
matching the existing section pattern) plus a standalone Support panel with
a mailto link and the GitHub repo link, reusing the existing flat
`help.contactText` / `help.githubLink` / `CONTACT_EMAIL` strings rather than
duplicating them. New copy references v2's actual settings path ("Settings
→ Data & Backup"), not v1's ("Settings → General → Backup & Transfer") — the
old copy would have been wrong for this surface. Evidence: `fix2-help-page.png`,
`fix2-help-page-scrolled2.png`.

### 3. No "Export Debug Log" in v2 Settings — false positive, already present

v1: Settings → Advanced → Debug Log → "Export Debug Log" downloads
diagnostic data for bug reports. Checked v2's Advanced, About, and Danger
Zone sections live and found no equivalent anywhere.

Evidence (of the apparent gap): `v1-settings-debug-log.png`,
`v2-settings-danger-about.png`, `v2-settings-notifications-advanced.png`.

**Resolution: no code change.** Reading `DataBackupSection.tsx` (v2 §9)
showed the shared `DebugExport` component _is_ already embedded there,
under a "Diagnostics" panel rendered after the two-column Storage/Backup
grid — `DataBackupSection.test.tsx` already asserts on
`v2.settings.data.diagnosticsHeader`. The live audit simply didn't scroll
far enough down §9 to see it. Corrected here rather than left as a
false-positive gap.

### 4. No dashboard Quick Actions in v2 Overview (minor)

v1's dashboard has one-click "+ Add Items", "📋 View Inventory", "🛒 Export
Shopping List". v2's Overview has none of these — all three destinations
still exist (confirmed: Inventory tab → `+ ADD`; Settings → Data & Backup →
`EXPORT SHOPPING LIST`), just one or two clicks further away, and Export
Shopping List in particular is now buried on settings section 9 of 11
instead of one click from the landing page.

Evidence: `v1-dashboard.png`, `v2-dashboard.png`, `v2-settings-categories.png`
(shows the relocated Export Shopping List button).

**Resolution:** added a Quick Actions row (+ ADD / VIEW INVENTORY / EXPORT
SHOPPING LIST) to both `Dashboard.tsx` and `MobileDashboard.tsx`, wired
through `DesignApp.tsx`'s `makeOnAddItem` helper (shared with the
Inventory page's own add-item entry point, so both now switch to the
Inventory nav on add) and `useShoppingListExport()` directly, matching
where v1's dashboard calls it. Export is disabled when nothing needs
restocking, same as v1.

### 5. Household presets don't reappear in v2 Settings (minor)

v1's Household Configuration settings page keeps "Single Person / Couple /
Family" one-click presets available any time. v2's onboarding has the same
presets (step 3 — actually a nicer P-01..P-04 layout, plus demo-data and
import-backup shortcuts v1 doesn't have), but once onboarding is done,
Settings → Household only exposes manual +/− steppers — no way to
one-click-reapply a preset later.

Evidence: `v1-settings.png`, `v2-settings-household.png`,
`v2-onboarding-step3-preset.png`.

**Resolution:** added Single/Couple/Family preset buttons to
`HouseholdSection.tsx` (v2 Settings §2), calling `useHousehold().setPreset`
— the same context method v1's `HouseholdForm` already uses — and reusing
the onboarding's existing `v2.onboarding.preset.presetNames.*` themed
labels rather than adding new translation strings. Evidence:
`fix5-household-presets.png`.

### 6. No "No Location" filter option in v2 (trivial)

v1's location filter dropdown has an explicit "No Location" entry to isolate
items without a location. v2's location filter only lists locations that
actually occur (Drawer/Garage/Pantry); there's no way to isolate
location-less items via the filter (they still display correctly as "—" in
the table itself).

**Resolution:** added a `LOCATION_FILTER_NONE` option (reusing v1's
`FilterBar`-exported sentinel rather than redeclaring it) to both
`InventoryFilterStrip` (desktop) and `MobileInventory`'s own location
select, plus a new `matchesLocationFilter` pure helper
(`utils/locationFilter.ts`) shared by desktop and mobile filtering logic.

## Explicitly checked and NOT gaps

- **Onboarding**: v2's onboarding is now the _only_ onboarding flow — even a
  fresh install with a classic theme pre-set in storage still routes through
  v2's 6-step flow. There is no v1 onboarding left to compare against; v1's
  `WelcomeScreen`/`HouseholdForm`/`QuickSetupScreen` components are
  effectively unreachable. Not a gap, just worth knowing before touching
  that code.
- **Disable Category**: v1 has the button on the Inventory page itself; v2
  moved it to Settings → Categories only. This was a deliberate call already
  recorded in the 07-31 doc ("do not duplicate it here") — confirmed working
  in Settings, not re-flagging it.
- **Custom Templates, Mark as Enough, Copy/Delete item, Recommendation Kits,
  Overridden/Disabled Recommendations, Hidden/Dismissed Alerts, Nutrition &
  Requirements, Manage Inventory Sets, Backup & Transfer, Danger Zone**: all
  live-verified present and working in v2 (mostly consolidated into fewer,
  better-organized settings sections — e.g. Recommendation Kits + Custom
  Templates + Disabled + Overridden all live under one "RECOMMENDATIONS"
  section). v2's Danger Zone actually has three actions (reset inventory /
  reset recommendations / factory reset) versus v1's one.
- **Freezer Hold Time (hours)** field exists in v1's household form but not
  v2's — however it's validated and stored but never read by any
  calculation in the codebase in either version, so omitting it from v2 has
  no functional effect. Noted, not counted as a real gap.
- The "picker category tile → + Custom Item defaults to the wrong category"
  behavior I initially suspected as a v2 bug is present **identically in
  v1** (`TemplateSelector`'s `onSelectCustom` also drops the in-picker
  category selection) — not a regression, not reported as a finding.

## Follow-up

All 6 findings closed 2026-08-08 (see "Resolution" under each). Verified
with: unit/integration tests (TDD — tests written before each fix), full
`npm run validate` (format, type-check, lint, duplication, 3934 tests,
build), and live-browser visual verification of every changed surface
(desktop + mobile) via Playwright.

Remaining housekeeping: archive `docs/plans/2026-07-31-v2-parity-gaps.md`
(superseded — all 5 of its gaps were independently confirmed closed here)
or update it to point here.
