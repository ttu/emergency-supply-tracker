# Design Doc: Settings Management

**Status:** Published  
**Last Updated:** 2025-01-XX  
**Authors:** Development Team

---

## Summary

The Settings Management system provides a comprehensive settings page where users can configure household, advanced features, language, theme, and manage data. All settings are persisted in LocalStorage and take effect immediately.

---

## Background

Users need a central place to configure:

- Household configuration (adults, children, duration, freezer)
- Advanced features (calorie tracking, power management, water tracking)
- Nutrition requirements (daily calories, water, children multiplier)
- Language and theme preferences
- Disabled recommendations
- Hidden alerts
- Data management (import/export, clear data)

---

## Goals and Non-Goals

### Goals

- ✅ Household configuration UI
- ✅ Advanced features toggles
- ✅ Nutrition requirements configuration
- ✅ Language selector (English/Finnish)
- ✅ Theme selector (Light/Dark/Auto)
- ✅ High contrast mode toggle
- ✅ Disabled recommendations management
- ✅ Hidden alerts management
- ✅ Data import/export
- ✅ Clear data with confirmation
- ✅ Recommendations import/export
- ✅ All settings persist in LocalStorage
- ✅ Settings take effect immediately

### Non-Goals

- ❌ User accounts/profiles
- ❌ Settings sync across devices
- ❌ Settings history/audit trail
- ❌ Custom themes (future feature)

---

## Design

### Settings Structure

**Location:** `src/shared/types/index.ts`

```typescript
interface UserSettings {
  language: 'en' | 'fi';
  theme: 'light' | 'dark' | 'auto';
  highContrast: boolean;
  enableCalorieTracking: boolean;
  enablePowerManagement: boolean;
  enableWaterTracking: boolean;
  dailyCaloriesPerPerson: number; // Default: 2000
  dailyWaterPerPerson: number; // Default: 3 liters
  childrenRequirementMultiplier: number; // Default: 0.75
  hasCompletedOnboarding: boolean;
}
```

### Settings Sections

**Location:** `src/pages/Settings.tsx`

1. **Household Configuration**
   - Adults, children, supply duration
   - Freezer toggle
   - Real-time preview of multiplier

2. **Nutrition & Requirements**
   - Daily calories per person
   - Daily water per person
   - Children requirement multiplier

3. **Advanced Features**
   - Calorie tracking toggle
   - Power management toggle
   - Water tracking toggle
   - Descriptions of each feature

4. **Appearance**
   - Language selector (English/Finnish)
   - Theme selector (Light/Dark/Auto)
   - High contrast mode toggle

5. **Hidden Alerts**
   - List of dismissed alerts
   - Reactivate individual alerts
   - Reactivate all alerts

6. **Disabled Recommendations**
   - List of disabled items
   - Re-enable individual items
   - Re-enable all items

7. **Recommended Items**
   - Current source (Built-in or Custom)
   - Import custom recommendations
   - Export current recommendations
   - Reset to default

8. **Data Management**
   - Export data (JSON)
   - Import data (JSON)
   - Export shopping list (TXT/MD/CSV)
   - Export debug logs
   - Clear all data (Danger Zone)

9. **About**
   - App version
   - GitHub repository link
   - App description

### Settings Persistence

**Location:** `src/features/settings/provider.tsx`

- React Context Provider manages settings state
- Auto-saves to LocalStorage on changes
- Provides `useSettings()` hook
- Settings take effect immediately (no reload needed)

### Theme Application

**Location:** `src/components/ThemeApplier.tsx`

- Applies theme class to `<html>` element
- Listens to theme changes
- Updates immediately on change
- Supports system preference (auto mode)

---

## Implementation Details

### Settings Provider

```typescript
function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() =>
    getAppData()?.settings || DEFAULT_SETTINGS
  );

  useEffect(() => {
    const appData = getAppData() || createDefaultAppData();
    saveAppData({ ...appData, settings });
  }, [settings]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
```

### Settings Components

**Location:** `src/features/settings/components/`

- `HouseholdForm.tsx` - Household configuration
- `NutritionSettings.tsx` - Nutrition requirements
- `AdvancedFeatures.tsx` - Feature toggles
- `LanguageSelector.tsx` - Language selection
- `ThemeSelector.tsx` - Theme selection
- `HiddenAlerts.tsx` - Alert management
- `DisabledRecommendations.tsx` - Recommendations management
- `RecommendationsStatus.tsx` - Recommendations info
- `ImportRecommendationsButton.tsx` - Import recommendations
- `ExportRecommendationsButton.tsx` - Export recommendations
- `ExportButton.tsx` - Export data
- `ImportButton.tsx` - Import data
- `ShoppingListExport.tsx` - Shopping list export
- `DebugExport.tsx` - Debug export
- `ClearDataButton.tsx` - Clear data

### Validation

- Household: Min 1 adult, 0+ children, 3+ days
- Nutrition: Positive numbers, reasonable ranges
- Language: Valid language codes
- Theme: Valid theme values

---

## Alternatives Considered

### Alternative 1: Separate Settings Pages

**Approach:** Split settings into multiple pages (Household, Appearance, Data).

**Rejected because:**

- Single page is simpler to navigate
- All settings in one place
- Scrollable list is fine for current scope

### Alternative 2: Settings Categories/Tabs

**Approach:** Use tabs to organize settings sections.

**Rejected because:**

- Current scope doesn't need tabs
- Single scrollable page is simpler
- Can add tabs if settings grow

### Alternative 3: Settings Search

**Approach:** Add search to find settings quickly.

**Rejected because:**

- Not needed for current scope
- Can be added as enhancement
- Settings are well-organized

---

## Risks and Mitigations

### Risk 1: Settings Not Persisting

**Risk:** Settings changes don't save properly.

**Mitigation:**

- Auto-save on every change
- Error handling for storage failures
- User feedback on save (toast notification)
- Test settings persistence

### Risk 2: Invalid Settings Values

**Risk:** Users enter invalid values (negative calories, etc.).

**Mitigation:**

- Form validation (min/max, type checking)
- TypeScript types prevent invalid states
- Clear error messages
- Default values on invalid input

### Risk 3: Settings Conflicts

**Risk:** Changing settings causes data inconsistencies.

**Mitigation:**

- Recalculate recommendations on household change
- Recalculate status on feature toggle
- Clear cached calculations
- Test settings changes thoroughly

---

## Open Questions

1. **Should we support settings export/import?**
   - Current: Part of full data export
   - Future: Could support settings-only export

2. **Should we support settings presets?**
   - Current: Manual configuration
   - Future: Could add presets (e.g., "Minimal", "Detailed")

3. **Should we show settings change history?**
   - Current: No history
   - Future: Could track changes for debugging

---

## References

- [001-household-configuration.md](./001-household-configuration.md) - Household config
- [006-data-import-export.md](./006-data-import-export.md) - Data management
- [003-recommended-items.md](./003-recommended-items.md) - Recommendations
- `src/features/settings/provider.tsx` - Implementation
- `src/pages/Settings.tsx` - Settings page
