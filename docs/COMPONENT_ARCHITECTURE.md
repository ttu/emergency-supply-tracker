# Component Architecture

> **Version:** 1.0.0
> **Last Updated:** 2025-12-28
> **Source of Truth:** `src/components/`

This document describes the React component structure of the Emergency Supply Tracker application.

---

## Directory Structure

```
src/components/
├── common/          # Reusable UI primitives
├── dashboard/       # Dashboard page components
├── inventory/       # Inventory management components
├── layout/          # App layout and navigation
├── onboarding/      # First-time user setup
└── settings/        # Settings page components
```

---

## Component Categories

### 1. Common (Atoms/Primitives)

Reusable building blocks used throughout the application.

| Component          | Description                      | Props                                    |
| ------------------ | -------------------------------- | ---------------------------------------- |
| `Badge`            | Status badge with color variants | `variant`, `children`                    |
| `Button`           | Primary action button            | `variant`, `onClick`, `disabled`         |
| `Card`             | Container with optional header   | `title`, `children`                      |
| `ErrorBoundary`    | React error boundary wrapper     | `children`, `fallback?`, `onError?`      |
| `Input`            | Text input field                 | `label`, `value`, `onChange`, `error`    |
| `LanguageSwitcher` | Language toggle (EN/FI)          | -                                        |
| `Modal`            | Dialog overlay                   | `isOpen`, `onClose`, `title`, `children` |
| `Navigation`       | Bottom/side navigation tabs      | `currentPath`, `onNavigate`              |
| `Select`           | Dropdown select                  | `options`, `value`, `onChange`           |
| `Tooltip`          | Hover tooltip                    | `content`, `children`                    |

### 2. Dashboard Components

Components for the main dashboard view.

| Component         | Description                                          | Used In      |
| ----------------- | ---------------------------------------------------- | ------------ |
| `AlertBanner`     | Displays warnings for expired/expiring/missing items | Dashboard    |
| `CategoryCard`    | Single category status card                          | CategoryGrid |
| `CategoryGrid`    | Grid layout of all category cards                    | Dashboard    |
| `DashboardHeader` | Overall preparedness summary                         | Dashboard    |

### 3. Inventory Components

Components for managing inventory items.

| Component               | Description                          | Used In        |
| ----------------------- | ------------------------------------ | -------------- |
| `CategoryNav`           | Horizontal category tabs             | Inventory page |
| `CategoryStatusSummary` | Category statistics display          | Inventory page |
| `FilterBar`             | Status filter buttons                | Inventory page |
| `ItemCard`              | Individual item display with actions | ItemList       |
| `ItemForm`              | Add/Edit item form                   | Modal          |
| `ItemList`              | Scrollable list of items             | Inventory page |
| `TemplateSelector`      | Product template picker              | ItemForm       |

### 4. Layout Components

Application shell and navigation.

| Component          | Description                 | Used In |
| ------------------ | --------------------------- | ------- |
| `Footer`           | App footer with links       | Layout  |
| `Header`           | App header with title       | Layout  |
| `Layout`           | Main app wrapper            | App     |
| `LanguageSwitcher` | Language toggle (EN/FI)     | Header  |
| `Navigation`       | Bottom/side navigation tabs | Layout  |
| `ThemeApplier`     | Applies theme to document   | App     |

### 5. Onboarding Components

First-time user setup flow.

| Component                 | Description                            | Step |
| ------------------------- | -------------------------------------- | ---- |
| `Onboarding`              | Main onboarding controller             | -    |
| `WelcomeScreen`           | Welcome message and language selection | 1    |
| `HouseholdPresetSelector` | Quick household presets                | 2    |
| `HouseholdForm`           | Detailed household configuration       | 3    |
| `QuickSetupScreen`        | Add recommended items option           | 4    |

### 6. Settings Components

Settings and data management.

| Component                 | Description                                  | Section         |
| ------------------------- | -------------------------------------------- | --------------- |
| `AdvancedFeatures`        | Toggle advanced feature flags                | Features        |
| `ClearDataButton`         | Delete all data with confirmation            | Data            |
| `DebugExport`             | Export error logs and debug information      | Data            |
| `DisabledRecommendations` | Manage disabled recommended items            | Recommendations |
| `ExportButton`            | Export data as JSON                          | Data            |
| `HiddenAlerts`            | Manage dismissed alerts                      | Alerts          |
| `HouseholdForm`           | Edit household configuration                 | Household       |
| `ImportButton`            | Import data from JSON                        | Data            |
| `LanguageSelector`        | Language preference                          | Preferences     |
| `NutritionSettings`       | Customize nutrition and requirement settings | Nutrition       |
| `ShoppingListExport`      | Export shopping list (TXT/Markdown/CSV)      | Data            |
| `ThemeSelector`           | Theme preference (light/dark/auto)           | Preferences     |

---

## Component Hierarchy

```
App
├── ErrorBoundary
├── ThemeApplier
└── Layout
    ├── Header
    │   └── LanguageSwitcher
    ├── Navigation
    └── [Page Content]
        │
        ├── Dashboard (/)
        │   ├── DashboardHeader
        │   ├── AlertBanner
        │   └── CategoryGrid
        │       └── CategoryCard[]
        │
        ├── Inventory (/inventory)
        │   ├── CategoryNav
        │   ├── FilterBar
        │   ├── CategoryStatusSummary
        │   └── ItemList
        │       └── ItemCard[]
        │
        ├── Settings (/settings)
        │   ├── HouseholdForm
        │   ├── NutritionSettings
        │   ├── AdvancedFeatures
        │   ├── LanguageSelector
        │   ├── ThemeSelector
        │   ├── HiddenAlerts
        │   ├── DisabledRecommendations
        │   ├── ExportButton
        │   ├── ImportButton
        │   ├── ShoppingListExport
        │   ├── DebugExport
        │   └── ClearDataButton
        │
        ├── Help (/help)
        │   └── Help (FAQ page with expandable topics)
        │
        └── Onboarding (first visit)
            ├── WelcomeScreen
            ├── HouseholdPresetSelector
            ├── HouseholdForm
            └── QuickSetupScreen
```

---

## State Management

### React Context Providers

| Context            | Purpose                             | Location                             |
| ------------------ | ----------------------------------- | ------------------------------------ |
| `SettingsContext`  | User settings and household config  | `src/contexts/SettingsProvider.tsx`  |
| `InventoryContext` | Inventory items and CRUD operations | `src/contexts/InventoryProvider.tsx` |

### Custom Hooks

| Hook           | Purpose                  | Location                    |
| -------------- | ------------------------ | --------------------------- |
| `useSettings`  | Access settings context  | `src/hooks/useSettings.ts`  |
| `useInventory` | Access inventory context | `src/hooks/useInventory.ts` |

---

## Component Patterns

### File Structure

Each component follows this structure:

```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.test.tsx  # Unit tests
└── ComponentName.stories.tsx # Storybook stories
```

Or as single file for simple components:

```
ComponentName.tsx
ComponentName.test.tsx
ComponentName.stories.tsx
```

### Props Pattern

```typescript
interface ComponentNameProps {
  // Required props
  requiredProp: string;

  // Optional props with defaults
  optionalProp?: boolean;

  // Event handlers
  onAction?: () => void;

  // Children
  children?: React.ReactNode;
}

export const ComponentName = ({
  requiredProp,
  optionalProp = false,
  onAction,
  children,
}: ComponentNameProps) => {
  // Component implementation
};
```

### Testing Pattern

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName requiredProp="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const onAction = jest.fn();
    render(<ComponentName requiredProp="test" onAction={onAction} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

### Storybook Pattern

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    requiredProp: 'Example',
  },
};

export const WithOptional: Story = {
  args: {
    requiredProp: 'Example',
    optionalProp: true,
  },
};
```

---

## Styling

- CSS Modules or inline styles
- Theme-aware colors via CSS custom properties
- Responsive design with mobile-first approach
- Consistent spacing using design tokens

---

## Accessibility

The application implements comprehensive accessibility features following WCAG 2.1 guidelines.

### Semantic HTML

- **Skip Link**: A "Skip to main content" link appears at the start of the page, visible only when focused
- **Landmarks**: Proper use of `<main>`, `<nav>`, `<header>`, `<section>` elements
- **Headings**: Correct heading hierarchy (h1 > h2 > h3)
- **Forms**: All form inputs have associated `<label>` elements
- **Dynamic Language**: The `lang` attribute on `<html>` updates based on the selected language

### ARIA Attributes

| Attribute             | Usage                                  |
| --------------------- | -------------------------------------- |
| `aria-label`          | Navigation elements, icon-only buttons |
| `aria-current="page"` | Active navigation items                |
| `aria-modal="true"`   | Modal dialogs                          |
| `aria-labelledby`     | Modal title associations               |
| `aria-invalid`        | Form validation errors                 |
| `aria-describedby`    | Error messages and helper text         |

### Keyboard Navigation

The application supports full keyboard navigation:

| Key                | Action                                              |
| ------------------ | --------------------------------------------------- |
| `Tab`              | Move focus to next interactive element              |
| `Shift + Tab`      | Move focus to previous interactive element          |
| `Enter` / `Space`  | Activate buttons and links                          |
| `Escape`           | Close modals and dialogs                            |
| `Arrow Left/Right` | Navigate between tabs in Navigation and CategoryNav |
| `Home`             | Jump to first navigation item                       |
| `End`              | Jump to last navigation item                        |

**Roving Tabindex**: Navigation components implement the roving tabindex pattern where only the active item is in the tab order, allowing arrow keys to move between items.

### Focus Management

- **Focus Indicators**: All interactive elements have visible focus states using CSS custom properties
- **Focus Trap**: Modal dialogs trap focus within the dialog
- **Focus Restoration**: When modals close, focus returns to the element that opened it
- **Focus-Visible**: Uses `:focus-visible` pseudo-class to show focus only for keyboard users

### High Contrast Mode

A high contrast mode is available in Settings > Appearance:

- **Toggle**: Separate checkbox that works with both light and dark themes
- **Light High Contrast**: Black text on white background with enhanced borders
- **Dark High Contrast**: White/yellow text on black background
- **Enhanced Focus**: Thicker focus indicators (4px) in high contrast mode
- **CSS Variables**: High contrast overrides standard color variables

### Color Contrast

- Normal text: Minimum 4.5:1 contrast ratio (WCAG AA)
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: Clear hover and focus states
- Status colors: Distinct colors for OK (green), Warning (yellow/orange), Critical (red)

### Screen Reader Support

- Meaningful alt text and aria-labels
- Status announcements use appropriate ARIA live regions
- Form validation messages are announced
- `.sr-only` utility class for visually hidden but screen-reader accessible text

---

## Running Lighthouse Accessibility Audit

To verify accessibility compliance, run a Lighthouse audit:

### Using Chrome DevTools

1. Open the application in Chrome
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to the **Lighthouse** tab
4. Select **Accessibility** category
5. Click **Analyze page load**
6. Review the report for issues and recommendations

### Using Lighthouse CLI

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run accessibility audit
lighthouse http://localhost:5173 --only-categories=accessibility --output=html --output-path=./lighthouse-report.html

# Open the report
open lighthouse-report.html
```

### Using Playwright for Automated Checks

```bash
# Run the accessibility audit with Playwright
npx playwright test --project=chromium

# Or use the axe-core integration in tests
```

### Target Scores

| Metric         | Target | Notes                     |
| -------------- | ------ | ------------------------- |
| Accessibility  | > 90   | WCAG 2.1 AA compliance    |
| Best Practices | > 90   | Security and code quality |
| Performance    | > 80   | Fast initial load         |

### Common Issues to Check

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast meets minimum ratios
- [ ] Touch targets are at least 44x44px
- [ ] Focus order is logical
- [ ] No content is keyboard-inaccessible
- [ ] Headings are in correct order
- [ ] Links have descriptive text (not "click here")

---

## Accessibility Testing in Storybook

The project includes the `@storybook/addon-a11y` addon for visual accessibility testing:

```bash
# Start Storybook
npm run storybook

# In Storybook, check the "Accessibility" tab for each component
```

The addon runs axe-core on each story and displays:

- Violations (must fix)
- Passes (compliant)
- Incomplete (needs manual review)
