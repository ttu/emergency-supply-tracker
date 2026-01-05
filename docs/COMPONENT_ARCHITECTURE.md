# Component Architecture

> **Version:** 2.0.0
> **Last Updated:** 2026-01-05
> **Source of Truth:** `src/features/` and `src/shared/components/`

This document describes the React component structure of the Emergency Supply Tracker application.

For overall application architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Directory Structure

The application uses a **Feature Slice Architecture** where components are organized by feature domain:

```
src/
├── features/              # Feature-specific components
│   ├── alerts/components/
│   ├── dashboard/components/
│   ├── household/components/
│   ├── inventory/components/
│   ├── onboarding/components/
│   ├── settings/components/
│   └── templates/components/
├── shared/components/     # Reusable UI primitives
├── pages/                 # Page components (compose features)
└── components/            # App-level components
```

---

## Shared Components

Reusable building blocks used throughout the application. Located in `src/shared/components/`.

| Component          | Description                      | Props                                    |
| ------------------ | -------------------------------- | ---------------------------------------- |
| `Badge`            | Status badge with color variants | `variant`, `children`                    |
| `Button`           | Primary action button            | `variant`, `onClick`, `disabled`         |
| `ErrorBoundary`    | React error boundary wrapper     | `children`, `fallback?`, `onError?`      |
| `Modal`            | Dialog overlay                   | `isOpen`, `onClose`, `title`, `children` |
| `Navigation`       | Bottom/side navigation tabs      | `currentPage`, `onNavigate`              |
| `Select`           | Dropdown select                  | `options`, `value`, `onChange`           |
| `LanguageSwitcher` | Language toggle (EN/FI)          | -                                        |

---

## Feature Components

### Dashboard Feature (`features/dashboard/components/`)

Components for the main dashboard view.

| Component         | Description                          | Used In      |
| ----------------- | ------------------------------------ | ------------ |
| `CategoryCard`    | Single category status card          | CategoryGrid |
| `CategoryGrid`    | Grid layout of all category cards    | Dashboard    |
| `DashboardHeader` | Overall preparedness summary         | Dashboard    |

### Alerts Feature (`features/alerts/components/`)

Alert display components.

| Component      | Description                                          | Used In   |
| -------------- | ---------------------------------------------------- | --------- |
| `AlertBanner`  | Displays warnings for expired/expiring/missing items | Dashboard |
| `HiddenAlerts` | Manage dismissed alerts                              | Settings  |

### Inventory Feature (`features/inventory/components/`)

Components for managing inventory items.

| Component               | Description                          | Used In        |
| ----------------------- | ------------------------------------ | -------------- |
| `CategoryNav`           | Horizontal category tabs             | Inventory page |
| `CategoryStatusSummary` | Category statistics display          | Inventory page |
| `FilterBar`             | Status filter buttons                | Inventory page |
| `ItemCard`              | Individual item display with actions | ItemList       |
| `ItemForm`              | Add/Edit item form                   | Modal          |
| `ItemList`              | Scrollable list of items             | Inventory page |

### Templates Feature (`features/templates/components/`)

Product template selection.

| Component          | Description             | Used In  |
| ------------------ | ----------------------- | -------- |
| `TemplateSelector` | Product template picker | ItemForm |

### Onboarding Feature (`features/onboarding/components/`)

First-time user setup flow.

| Component                 | Description                            | Step |
| ------------------------- | -------------------------------------- | ---- |
| `Onboarding`              | Main onboarding controller             | -    |
| `WelcomeScreen`           | Welcome message and language selection | 1    |
| `HouseholdPresetSelector` | Quick household presets                | 2    |
| `HouseholdForm`           | Detailed household configuration       | 3    |
| `QuickSetupScreen`        | Add recommended items option           | 4    |

### Settings Feature (`features/settings/components/`)

Settings and data management.

| Component                 | Description                                  | Section         |
| ------------------------- | -------------------------------------------- | --------------- |
| `ClearDataButton`         | Delete all data with confirmation            | Data            |
| `DebugExport`             | Export error logs and debug information      | Data            |
| `DisabledRecommendations` | Manage disabled recommended items            | Recommendations |
| `ExportButton`            | Export data as JSON                          | Data            |
| `HouseholdForm`           | Edit household configuration                 | Household       |
| `ImportButton`            | Import data from JSON                        | Data            |
| `LanguageSelector`        | Language preference                          | Preferences     |
| `NutritionSettings`       | Customize nutrition and requirement settings | Nutrition       |
| `OverriddenRecommendations` | Manage quantity overrides                  | Recommendations |
| `RecommendationsStatus`   | Display custom recommendations status        | Recommendations |
| `ShoppingListExport`      | Export shopping list (TXT/Markdown/CSV)      | Data            |
| `ThemeSelector`           | Theme preference (light/dark/auto)           | Preferences     |

---

## Component Hierarchy

```
App
├── ErrorBoundary
├── SettingsProvider
├── ThemeApplier
├── HouseholdProvider
├── RecommendedItemsProvider
├── InventoryProvider
└── AppContent
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
        │   ├── LanguageSelector
        │   ├── ThemeSelector
        │   ├── HiddenAlerts
        │   ├── DisabledRecommendations
        │   ├── OverriddenRecommendations
        │   ├── RecommendationsStatus
        │   ├── ExportButton
        │   ├── ImportButton
        │   ├── ShoppingListExport
        │   ├── DebugExport
        │   └── ClearDataButton
        │
        ├── Help (/help)
        │   └── Help (FAQ page)
        │
        └── Onboarding (first visit)
            ├── WelcomeScreen
            ├── HouseholdPresetSelector
            ├── HouseholdForm
            └── QuickSetupScreen
```

---

## State Management

### Context Providers

| Context                    | Purpose                             | Location                                   |
| -------------------------- | ----------------------------------- | ------------------------------------------ |
| `SettingsContext`          | User settings and preferences       | `features/settings/context/`               |
| `HouseholdContext`         | Household configuration             | `features/household/context/`              |
| `InventoryContext`         | Inventory items and CRUD operations | `features/inventory/context/`              |
| `RecommendedItemsContext`  | Custom recommended items            | `shared/contexts/`                         |

### Custom Hooks

| Hook                   | Purpose                         | Location                     |
| ---------------------- | ------------------------------- | ---------------------------- |
| `useSettings`          | Access settings context         | `features/settings/hooks/`   |
| `useHousehold`         | Access household context        | `features/household/hooks/`  |
| `useInventory`         | Access inventory context        | `features/inventory/hooks/`  |
| `useRecommendedItems`  | Access recommended items        | `shared/hooks/`              |
| `useKeyboardNavigation`| Keyboard navigation utilities   | `shared/hooks/`              |

---

## Component Patterns

### File Structure

Each component follows this structure within its feature:

```
features/{feature}/components/
├── ComponentName/
│   ├── ComponentName.tsx         # Main component
│   ├── ComponentName.module.css  # Styles
│   ├── ComponentName.test.tsx    # Tests
│   └── ComponentName.stories.tsx # Storybook stories
└── index.ts                      # Component exports
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
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComponentName } from './ComponentName';
import { SettingsProvider } from '@/features/settings';

const meta: Meta<typeof ComponentName> = {
  title: 'Feature/ComponentName',
  component: ComponentName,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <Story />
      </SettingsProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    requiredProp: 'Example',
  },
};
```

---

## Styling

- **CSS Modules** for component-scoped styles
- Theme-aware colors via CSS custom properties
- Responsive design with mobile-first approach
- Consistent spacing using design tokens

---

## Accessibility

The application implements comprehensive accessibility features following WCAG 2.1 guidelines.

### Semantic HTML

- **Skip Link**: A "Skip to main content" link appears at the start of the page
- **Landmarks**: Proper use of `<main>`, `<nav>`, `<header>`, `<section>` elements
- **Headings**: Correct heading hierarchy (h1 > h2 > h3)
- **Forms**: All form inputs have associated `<label>` elements
- **Dynamic Language**: The `lang` attribute on `<html>` updates based on selected language

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

| Key                | Action                                              |
| ------------------ | --------------------------------------------------- |
| `Tab`              | Move focus to next interactive element              |
| `Shift + Tab`      | Move focus to previous interactive element          |
| `Enter` / `Space`  | Activate buttons and links                          |
| `Escape`           | Close modals and dialogs                            |
| `Arrow Left/Right` | Navigate between tabs in Navigation and CategoryNav |
| `Home`             | Jump to first navigation item                       |
| `End`              | Jump to last navigation item                        |

### Focus Management

- **Focus Indicators**: All interactive elements have visible focus states
- **Focus Trap**: Modal dialogs trap focus within the dialog
- **Focus Restoration**: When modals close, focus returns to the opening element
- **Focus-Visible**: Uses `:focus-visible` for keyboard-only focus indicators

### High Contrast Mode

- Toggle available in Settings > Appearance
- Works with both light and dark themes
- Enhanced focus indicators (4px) in high contrast mode

### Color Contrast

- Normal text: Minimum 4.5:1 contrast ratio (WCAG AA)
- Large text: Minimum 3:1 contrast ratio
- Status colors: Distinct colors for OK (green), Warning (yellow/orange), Critical (red)

---

## Accessibility Testing

### Storybook Addon

```bash
npm run storybook
# Check the "Accessibility" tab for each component
```

### Lighthouse CLI

```bash
lighthouse http://localhost:5173 --only-categories=accessibility --output=html
```

### Target Scores

| Metric        | Target | Notes                  |
| ------------- | ------ | ---------------------- |
| Accessibility | > 90   | WCAG 2.1 AA compliance |
| Performance   | > 80   | Fast initial load      |
