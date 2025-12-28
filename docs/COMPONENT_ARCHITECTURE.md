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

| Component | Description | Props |
|-----------|-------------|-------|
| `Badge` | Status badge with color variants | `variant`, `children` |
| `Button` | Primary action button | `variant`, `onClick`, `disabled` |
| `Card` | Container with optional header | `title`, `children` |
| `Input` | Text input field | `label`, `value`, `onChange`, `error` |
| `Modal` | Dialog overlay | `isOpen`, `onClose`, `title`, `children` |
| `Select` | Dropdown select | `options`, `value`, `onChange` |
| `Tooltip` | Hover tooltip | `content`, `children` |

### 2. Dashboard Components

Components for the main dashboard view.

| Component | Description | Used In |
|-----------|-------------|---------|
| `AlertBanner` | Displays warnings for expired/expiring/missing items | Dashboard |
| `CategoryCard` | Single category status card | CategoryGrid |
| `CategoryGrid` | Grid layout of all category cards | Dashboard |
| `DashboardHeader` | Overall preparedness summary | Dashboard |

### 3. Inventory Components

Components for managing inventory items.

| Component | Description | Used In |
|-----------|-------------|---------|
| `CategoryNav` | Horizontal category tabs | Inventory page |
| `CategoryStatusSummary` | Category statistics display | Inventory page |
| `FilterBar` | Status filter buttons | Inventory page |
| `ItemCard` | Individual item display with actions | ItemList |
| `ItemForm` | Add/Edit item form | Modal |
| `ItemList` | Scrollable list of items | Inventory page |
| `TemplateSelector` | Product template picker | ItemForm |

### 4. Layout Components

Application shell and navigation.

| Component | Description | Used In |
|-----------|-------------|---------|
| `Footer` | App footer with links | Layout |
| `Header` | App header with title | Layout |
| `Layout` | Main app wrapper | App |
| `LanguageSwitcher` | Language toggle (EN/FI) | Header |
| `Navigation` | Bottom/side navigation tabs | Layout |
| `ThemeApplier` | Applies theme to document | App |

### 5. Onboarding Components

First-time user setup flow.

| Component | Description | Step |
|-----------|-------------|------|
| `Onboarding` | Main onboarding controller | - |
| `WelcomeScreen` | Welcome message and language selection | 1 |
| `HouseholdPresetSelector` | Quick household presets | 2 |
| `HouseholdForm` | Detailed household configuration | 3 |
| `QuickSetupScreen` | Add recommended items option | 4 |

### 6. Settings Components

Settings and data management.

| Component | Description | Section |
|-----------|-------------|---------|
| `AdvancedFeatures` | Toggle advanced feature flags | Features |
| `ClearDataButton` | Delete all data with confirmation | Data |
| `ExportButton` | Export data as JSON | Data |
| `HouseholdForm` | Edit household configuration | Household |
| `ImportButton` | Import data from JSON | Data |
| `LanguageSelector` | Language preference | Preferences |
| `ShoppingListExport` | Export shopping list (TODO) | Data |
| `ThemeSelector` | Theme preference (light/dark/auto) | Preferences |

---

## Component Hierarchy

```
App
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
        │   ├── AdvancedFeatures
        │   ├── LanguageSelector
        │   ├── ThemeSelector
        │   ├── ExportButton
        │   ├── ImportButton
        │   ├── ShoppingListExport
        │   └── ClearDataButton
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

| Context | Purpose | Location |
|---------|---------|----------|
| `SettingsContext` | User settings and household config | `src/contexts/SettingsProvider.tsx` |
| `InventoryContext` | Inventory items and CRUD operations | `src/contexts/InventoryProvider.tsx` |

### Custom Hooks

| Hook | Purpose | Location |
|------|---------|----------|
| `useSettings` | Access settings context | `src/hooks/useSettings.ts` |
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

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management in modals
- Color contrast WCAG 2.1 AA compliant
