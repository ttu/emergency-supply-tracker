# Smoke Tests - Complete Application Flow

## Overview

The smoke tests verify **ALL major user actions** in the application through two distinct user journeys:

1. **Quick Setup Flow** (`e2e/smoke-quick-setup.spec.ts`) - The "Guided" path where users add all recommended items during onboarding
2. **Manual Entry Flow** (`e2e/smoke-manual-entry.spec.ts`) - The "DIY/Power User" path where users skip Quick Setup and manually add items

Both tests exercise complete application functionality from first-time onboarding through all features and are designed to run against PR deployments to verify the entire application works end-to-end.

## Test Coverage

### Quick Setup Flow (Most Common User Path)

Tests the **guided onboarding experience** with comprehensive phases:

1. **Onboarding with Quick Setup** - Welcome → Preset → Household → Add Recommended Items
2. **Verify Items Added** - Check recommended items were bulk-added with quantity 0
3. **Edit Multiple Items** - Update quantities on items from different categories (Water, Food, Medical)
   - Add **sufficient quantity** (Water - 50L)
   - Add **less than recommended** (Food - 2 pieces for Family)
   - Add **sufficient quantity** (Medical - 10 pieces)
   - **Disable recommendation** for insufficient item
4. **Copy/Duplicate Item** - Test copying an item with different expiration date
5. **Dashboard Alerts** - View alerts for insufficient quantities, dismiss alerts
6. **Settings - All Features** - Language, theme, advanced features, household config changes
7. **Re-enable Disabled Recommendation** - Navigate to Settings → Re-enable previously disabled item
8. **Data Management** - Export data, shopping list, recommendations
9. **Navigation & Persistence** - Verify data persists after reload
10. **Final Verification** - Dashboard loads with all sections

**Key Coverage:**

- Tests bulk item creation from recommendations
- Tests editing multiple items across categories
- Tests adding less than recommended quantity
- Tests disabling and re-enabling recommendations
- Tests copying/duplicating items
- Verifies recommended quantity calculations

### Manual Entry Flow (Power User Path)

Tests the **DIY manual entry experience** with 8 comprehensive phases:

1. **Onboarding - Skip Quick Setup** - Welcome → Preset → Household → Skip
2. **Dashboard Interactions** - Quick actions, category cards, navigation
3. **Inventory Management** - Add from template, add custom item, edit, filter, search, recommended items (add/disable)
4. **Dashboard Alerts** - View alerts, dismiss alerts
5. **Settings - All Features** - Language, theme, high contrast, household config, presets, advanced features, nutrition settings
6. **Data Management** - Export data, export shopping list, export recommendations
7. **Navigation & Persistence** - Navigate all pages, verify data and settings persist after reload
8. **Final Verification** - Dashboard loads with all sections

**Key Differences:**

- Tests manual item creation workflow
- Tests template search and selection
- Tests custom item creation
- More comprehensive settings coverage

## Running the Smoke Tests

### Against Local Development Server

```bash
# Run both smoke tests (recommended)
npm run test:e2e:smoke

# Run individual tests
npm run test:e2e:smoke:quick-setup    # Quick Setup flow only
npm run test:e2e:smoke:manual-entry   # Manual Entry flow only
```

These run against `http://localhost:5173` (default).

### Against Deployed PR Site

To run smoke tests against a deployed PR preview (e.g., Vercel preview):

```bash
# Both tests
PLAYWRIGHT_BASE_URL=https://your-pr-preview.vercel.app npm run test:e2e:smoke

# Individual tests
PLAYWRIGHT_BASE_URL=https://your-pr-preview.vercel.app npm run test:e2e:smoke:quick-setup
PLAYWRIGHT_BASE_URL=https://your-pr-preview.vercel.app npm run test:e2e:smoke:manual-entry
```

Or set it as an environment variable:

```bash
export PLAYWRIGHT_BASE_URL=https://your-pr-preview.vercel.app
npm run test:e2e:smoke
```

### Example: CI/CD Integration

For GitHub Actions or other CI systems, you can add this to your workflow:

```yaml
- name: Run smoke test against PR preview
  run: |
    PLAYWRIGHT_BASE_URL=${{ env.PREVIEW_URL }} npm run test:e2e:smoke
  env:
    PREVIEW_URL: ${{ steps.deploy.outputs.preview_url }}
```

## Test Phases

### Phase 1: Onboarding

- Clears localStorage to simulate first-time user
- Completes welcome screen
- Selects "Family" preset
- Verifies household configuration
- Skips quick setup

### Phase 2: Dashboard Interactions

- Verifies dashboard elements (Quick Actions, Categories Overview)
- Tests quick action buttons (Add Items)
- Tests category card navigation

### Phase 3: Edit Multiple Recommended Items (Quick Setup)

- Edits Water item - adds sufficient quantity (50L)
- Edits Food item - adds LESS than recommended (2 pieces)
- Disables the insufficient recommendation
- Edits Medical item - adds sufficient quantity (10 pieces)
- Tests Copy/Duplicate functionality:
  - Copies Water item
  - Modifies quantity (25L)
  - Adds expiration date (30 days from now)

### Phase 3 (Manual Entry): Inventory Management

- Adds item from template (search and select)
- Creates custom item
- Edits existing item
- Filters by category
- Searches items
- Tests recommended items (add, disable)
- Creates item with expiration date (for alerts)

### Phase 4: Dashboard Alerts

- Navigates to dashboard
- Verifies alerts section appears
- Verifies expired alert is visible
- Dismisses alert from dashboard
- Verifies alert is no longer visible

### Phase 5: Settings - All Features

- Changes language (English ↔ Finnish)
- Changes theme (light, dark, etc.)
- Toggles advanced features (calorie tracking, etc.)

### Phase 5B: Re-enable Disabled Recommendation

- Scrolls to "Disabled Recommendations" section
- Finds the previously disabled item
- Clicks "Enable" button
- Verifies item is re-enabled

### Phase 5C: Household Changes

- Updates household configuration
- Uses household presets (changes Family → Single Person)
- Verifies recommended quantities recalculate

### Phase 6: Data Management

- Exports all app data
- Exports shopping list
- Exports recommendations

### Phase 7: Navigation & Persistence

- Navigates between all pages (Dashboard, Inventory, Settings, Help)
- Reloads page
- Verifies data persisted (localStorage check)
- Verifies settings persisted

### Phase 8: Final Verification

- Returns to dashboard
- Verifies dashboard loads with all sections

## Notes

- Both tests use localStorage verification as a fallback for item visibility checks
- Tests are designed to be resilient to minor UI timing issues
- **All major user actions are tested across both comprehensive test runs**
- Quick Setup test: ~25-30 seconds (more comprehensive with multiple item edits, copy, disable/enable)
- Manual Entry test: ~20 seconds
- Test timeout is set to 2 minutes to accommodate all actions
- Optional UI elements are checked conditionally (won't fail if not present)
- Running both tests provides complete coverage of both critical user paths

## Troubleshooting

If the test fails:

1. **Check the deployed site is accessible** - Verify the `PLAYWRIGHT_BASE_URL` is correct
2. **Check browser console** - Look for JavaScript errors in the test output
3. **Check network requests** - Verify the site is loading all resources
4. **Review test output** - The test provides detailed error messages for each phase

## Integration with PR Workflows

These smoke tests are ideal for:

- **Pre-merge verification** - Run against PR preview deployments
- **Post-deploy verification** - Run against staging/production after deployment
- **Regression testing** - Verify critical paths still work after changes
- **CI/CD pipelines** - Automated testing in deployment workflows

## Why Two Smoke Tests?

Having separate tests for each onboarding path provides:

1. **Better Coverage** - Each tests a distinct user journey (guided vs. manual)
2. **Faster Debugging** - Know which onboarding path broke
3. **Parallel Execution** - Can run both simultaneously in CI
4. **Real-world Scenarios** - Both are valid, common user paths
