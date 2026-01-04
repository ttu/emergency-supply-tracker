# Design Doc: Onboarding Flow

**Status:** Published  
**Last Updated:** 2025-01-XX  
**Authors:** Development Team

---

## Summary

The Onboarding Flow guides first-time users through a 4-step process to configure their household and optionally add recommended items to their inventory. It provides a smooth introduction to the application.

---

## Background

First-time users need guidance to:

- Understand what the app does
- Configure their household (size, duration)
- Optionally add recommended items
- Start using the app

The onboarding flow should be quick, intuitive, and not overwhelming.

---

## Goals and Non-Goals

### Goals

- ✅ Welcome screen with app explanation
- ✅ Language selection (English/Finnish)
- ✅ Household preset selection (quick setup)
- ✅ Household configuration form
- ✅ Quick setup option (add all recommended items)
- ✅ Skip option (start with empty inventory)
- ✅ Progress indicators
- ✅ Back/forward navigation
- ✅ Persist onboarding completion

### Non-Goals

- ❌ Tutorial/walkthrough (future feature)
- ❌ Video tutorials
- ❌ Multi-step validation (validate on submit)
- ❌ Account creation (no accounts)

---

## Design

### Flow Steps

**Step 1: Welcome**

- App name and brief description
- Language selector (English/Finnish)
- "Continue" button

**Step 2: Preset Selection**

- Common household presets:
  - Single person (1 adult, 0 children)
  - Couple (2 adults, 0 children)
  - Family with kids (2 adults, 2 children)
  - Custom (manual entry)
- Pre-fills household form if preset selected

**Step 3: Household Configuration**

- Number of adults (min: 1, default: 2)
- Number of children (min: 0, default: 0)
- Supply duration in days (min: 3, default: 7)
- Use freezer toggle (default: false)
- Back/Continue buttons

**Step 4: Quick Setup**

- Option 1: "Add All Recommended Items"
  - Adds all 70 recommended items with quantity=0
  - User can update quantities later
- Option 2: "Start Empty"
  - Starts with empty inventory
  - User adds items manually
- Shows summary of what will be added (if Option 1)
- "Complete Setup" button

### Completion

**On Complete:**

1. Save household configuration
2. Save settings (language, etc.)
3. Add items to inventory (if Quick Setup selected)
4. Mark onboarding as complete
5. Navigate to Dashboard

**Onboarding Completion Flag:**

- Stored in LocalStorage
- Checked on app load
- If complete → Skip onboarding, go to Dashboard
- If not complete → Show onboarding

---

## Implementation Details

### Component Structure

**Location:** `src/features/onboarding/components/Onboarding.tsx`

```typescript
type OnboardingStep = 'welcome' | 'preset' | 'household' | 'quickSetup';

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedPreset, setSelectedPreset] = useState<HouseholdPreset | null>(null);
  const [householdConfig, setHouseholdConfig] = useState<HouseholdConfig | null>(null);

  // Step navigation handlers
  // ...

  return (
    <div>
      {currentStep === 'welcome' && <WelcomeScreen onContinue={...} />}
      {currentStep === 'preset' && <HouseholdPresetSelector onSelect={...} />}
      {currentStep === 'household' && <HouseholdForm onSubmit={...} />}
      {currentStep === 'quickSetup' && <QuickSetupScreen onComplete={...} />}
    </div>
  );
};
```

### Sub-Components

1. **WelcomeScreen**
   - App description
   - Language selector
   - Continue button

2. **HouseholdPresetSelector**
   - Preset cards (Single, Couple, Family, Custom)
   - Visual icons/illustrations
   - Click to select

3. **HouseholdForm**
   - Form inputs (adults, children, days, freezer)
   - Validation
   - Back/Continue buttons

4. **QuickSetupScreen**
   - Two options (Add All / Start Empty)
   - Summary of items to add (if Add All)
   - Complete button

### Integration with App

**Location:** `src/App.tsx`

```typescript
function App() {
  const appData = getAppData();
  const hasCompletedOnboarding = appData?.settings?.hasCompletedOnboarding;

  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <Router>...</Router>;
}
```

### Preset Definitions

**Location:** `src/features/onboarding/components/HouseholdPresetSelector.tsx`

```typescript
interface HouseholdPreset {
  id: string;
  name: string;
  description: string;
  adults: number;
  children: number;
  supplyDays: number;
  useFreezer: boolean;
}

const PRESETS: HouseholdPreset[] = [
  {
    id: 'single',
    name: 'Single Person',
    adults: 1,
    children: 0,
    supplyDays: 7,
    useFreezer: false,
  },
  // ... more presets
];
```

---

## Alternatives Considered

### Alternative 1: Single-Step Onboarding

**Approach:** Combine all steps into one long form.

**Rejected because:**

- Overwhelming for users
- Multi-step is more digestible
- Better UX with progress indicators

### Alternative 2: Skip Onboarding

**Approach:** Allow users to skip onboarding entirely.

**Rejected because:**

- Household config is required for recommendations
- Better to guide users through setup
- Can still start with empty inventory

### Alternative 3: Tutorial After Onboarding

**Approach:** Show tutorial/walkthrough after onboarding.

**Rejected because:**

- Not in scope for v1
- Can be added as enhancement
- Help page provides guidance

---

## Risks and Mitigations

### Risk 1: Users Abandon Onboarding

**Risk:** Users find onboarding too long, abandon app.

**Mitigation:**

- Keep steps short and focused
- Clear progress indicators
- Skip option (start empty)
- Quick preset selection

### Risk 2: Invalid Household Config

**Risk:** Users enter invalid values (0 adults, negative children).

**Mitigation:**

- Form validation (min/max values)
- TypeScript types prevent invalid states
- Default values on preset selection
- Clear error messages

### Risk 3: Performance with Many Items

**Risk:** Adding all 70 items in Quick Setup could be slow.

**Mitigation:**

- Batch add operations
- Show loading indicator
- Tested with 70 items (acceptable performance)
- Users can skip and add manually

---

## Open Questions

1. **Should we support onboarding reset?**
   - Current: One-time only
   - Future: Could add "Reset Onboarding" in Settings

2. **Should we show tooltips during onboarding?**
   - Current: No
   - Future: Could add contextual help

3. **Should we support more presets?**
   - Current: 4 presets
   - Future: Could add more (e.g., "Large Family", "Seniors")

---

## References

- [001-household-configuration.md](./001-household-configuration.md) - Household config details
- [003-recommended-items.md](./003-recommended-items.md) - Recommended items
- `src/features/onboarding/components/Onboarding.tsx` - Implementation
- `src/App.tsx` - App integration
