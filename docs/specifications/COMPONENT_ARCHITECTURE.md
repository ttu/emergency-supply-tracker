# Component Architecture - Emergency Supply Tracker

## Overview
This document outlines the component architecture for the Emergency Supply Tracker, emphasizing separation of concerns between presentational (pure) components and container (smart) components, with full Storybook integration.

## Architecture Philosophy

### Core Principles
1. **Separation of Concerns** - Presentational components handle UI, containers handle logic
2. **Storybook-First Development** - Build and test components in isolation
3. **Type Safety** - TypeScript for all props and state
4. **Reusability** - Pure components can be reused across the app
5. **Testability** - Easier to test when UI is separated from logic

---

## Component Patterns

### 1. Presentational Components (Pure/Dumb)

**Characteristics:**
- Receive all data via props
- No state management (except local UI state like "is dropdown open")
- No side effects
- No direct data fetching
- Fully documented in Storybook
- Highly reusable

**Example:**
```typescript
// src/components/ItemCard/ItemCard.tsx
interface ItemCardProps {
  name: string;
  quantity: number;
  recommendedQuantity: number;
  unit: string;
  expirationDate?: string;
  status: 'ok' | 'warning' | 'critical';
  onEdit: () => void;
  onDelete: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  name,
  quantity,
  recommendedQuantity,
  unit,
  expirationDate,
  status,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={`item-card item-card--${status}`}>
      <div className="item-card__header">
        <h3>{name}</h3>
        <StatusBadge status={status} />
      </div>

      <div className="item-card__content">
        <QuantityDisplay
          current={quantity}
          recommended={recommendedQuantity}
          unit={unit}
        />

        {expirationDate && (
          <ExpirationDisplay date={expirationDate} />
        )}
      </div>

      <div className="item-card__actions">
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="danger" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
};
```

**Storybook Story:**
```typescript
// src/components/ItemCard/ItemCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ItemCard } from './ItemCard';

const meta: Meta<typeof ItemCard> = {
  title: 'Components/ItemCard',
  component: ItemCard,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['ok', 'warning', 'critical'],
    },
    onEdit: { action: 'edit clicked' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ItemCard>;

export const Default: Story = {
  args: {
    name: 'Bottled Water',
    quantity: 15,
    recommendedQuantity: 18,
    unit: 'liters',
    expirationDate: '2025-06-15',
    status: 'warning',
  },
};

export const Critical: Story = {
  args: {
    name: 'Canned Soup',
    quantity: 0,
    recommendedQuantity: 12,
    unit: 'cans',
    status: 'critical',
  },
};

export const Ok: Story = {
  args: {
    name: 'Flashlight',
    quantity: 2,
    recommendedQuantity: 2,
    unit: 'pieces',
    status: 'ok',
  },
};

export const ExpiringSoon: Story = {
  args: {
    name: 'First Aid Kit',
    quantity: 1,
    recommendedQuantity: 1,
    unit: 'pieces',
    expirationDate: '2025-01-05',
    status: 'warning',
  },
};
```

### 2. Container Components (Smart)

**Characteristics:**
- Connect to state management (Context, hooks)
- Handle business logic
- Fetch/manipulate data
- Pass data and callbacks to presentational components
- Minimal UI rendering

**Example:**
```typescript
// src/containers/ItemCardContainer.tsx
import { ItemCard } from '../components/ItemCard/ItemCard';
import { useInventory } from '../hooks/useInventory';
import { useHousehold } from '../hooks/useHousehold';
import { calculateRecommendedQuantity, getItemStatus } from '../utils';

interface ItemCardContainerProps {
  itemId: string;
}

export const ItemCardContainer: React.FC<ItemCardContainerProps> = ({ itemId }) => {
  const { items, updateItem, deleteItem } = useInventory();
  const { household } = useHousehold();

  const item = items.find(i => i.id === itemId);

  if (!item) return null;

  // Business logic happens here
  const recommendedQuantity = calculateRecommendedQuantity(
    item.recommendedItemId,
    household
  );

  const status = getItemStatus(item, recommendedQuantity, new Date());

  const handleEdit = () => {
    // Navigate to edit modal/page
  };

  const handleDelete = () => {
    if (confirm('Are you sure?')) {
      deleteItem(itemId);
    }
  };

  // Just pass props to presentational component
  return (
    <ItemCard
      name={item.name}
      quantity={item.quantity}
      recommendedQuantity={recommendedQuantity}
      unit={item.unit}
      expirationDate={item.expirationDate}
      status={status}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
```

---

## Component Hierarchy

### Application Structure

```
src/
├── components/              # Presentational components (Storybook)
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   ├── Button.test.tsx
│   │   └── Button.module.css
│   ├── ItemCard/
│   │   ├── ItemCard.tsx
│   │   ├── ItemCard.stories.tsx
│   │   ├── ItemCard.test.tsx
│   │   └── ItemCard.module.css
│   ├── StatusBadge/
│   ├── QuantityDisplay/
│   ├── ExpirationDisplay/
│   ├── CategoryCard/
│   ├── AlertBanner/
│   ├── ProgressBar/
│   └── ...
│
├── containers/              # Container components (connect logic to UI)
│   ├── ItemCardContainer.tsx
│   ├── DashboardContainer.tsx
│   ├── InventoryListContainer.tsx
│   └── ...
│
├── pages/                   # Page-level components
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   └── Dashboard.test.tsx
│   ├── Inventory/
│   ├── Settings/
│   └── Onboarding/
│
├── hooks/                   # Custom hooks
│   ├── useInventory.ts
│   ├── useHousehold.ts
│   ├── useRecommendedItems.ts
│   └── ...
│
├── context/                 # React Context
│   ├── AppContext.tsx
│   └── I18nContext.tsx
│
├── utils/                   # Pure utility functions
│   ├── calculations.ts
│   ├── status.ts
│   ├── dates.ts
│   └── ...
│
└── types/                   # TypeScript types
    └── index.ts
```

---

## Core Presentational Components

### 1. Atomic Components (Smallest building blocks)

#### Button
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### StatusBadge
```typescript
interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'critical';
  showLabel?: boolean;
}
```

#### QuantityDisplay
```typescript
interface QuantityDisplayProps {
  current: number;
  recommended: number;
  unit: string;
  showProgress?: boolean;
}
```

#### ExpirationDisplay
```typescript
interface ExpirationDisplayProps {
  date: string;
  daysUntil?: number;
  isExpired?: boolean;
}
```

### 2. Molecule Components (Combinations of atoms)

#### ItemCard
```typescript
interface ItemCardProps {
  name: string;
  quantity: number;
  recommendedQuantity: number;
  unit: string;
  expirationDate?: string;
  status: 'ok' | 'warning' | 'critical';
  onEdit: () => void;
  onDelete: () => void;
}
```

#### CategoryCard
```typescript
interface CategoryCardProps {
  name: string;
  icon: string;
  itemCount: number;
  status: 'ok' | 'warning' | 'critical';
  preparednessPercentage: number;
  onClick: () => void;
}
```

#### AlertBanner
```typescript
interface AlertBannerProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

### 3. Organism Components (Complex UI sections)

#### ItemList
```typescript
interface ItemListProps {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    recommendedQuantity: number;
    unit: string;
    expirationDate?: string;
    status: 'ok' | 'warning' | 'critical';
  }>;
  onItemEdit: (itemId: string) => void;
  onItemDelete: (itemId: string) => void;
  emptyMessage?: string;
}
```

#### DashboardOverview
```typescript
interface DashboardOverviewProps {
  householdSummary: {
    adults: number;
    children: number;
    days: number;
  };
  preparednessPercentage: number;
  alerts: Array<{
    id: string;
    type: 'expiring' | 'expired' | 'missing';
    itemName: string;
    daysUntilExpiration?: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    status: 'ok' | 'warning' | 'critical';
    percentage: number;
  }>;
  onCategoryClick: (categoryId: string) => void;
}
```

#### ItemForm
```typescript
interface ItemFormProps {
  initialValues?: {
    name?: string;
    quantity?: number;
    unit?: string;
    expirationDate?: string;
    notes?: string;
    location?: string;
  };
  availableUnits: string[];
  onSubmit: (values: ItemFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

---

## Storybook Organization

### Directory Structure
```
.storybook/
├── main.ts                 # Storybook configuration
├── preview.ts              # Global decorators and parameters
└── theme.ts                # Custom theme

src/
└── components/
    ├── Button/
    │   ├── Button.tsx
    │   ├── Button.stories.tsx        # Stories for Button
    │   └── Button.test.tsx
    └── ItemCard/
        ├── ItemCard.tsx
        └── ItemCard.stories.tsx      # Stories for ItemCard
```

### Storybook Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',           // Accessibility testing
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import { I18nProvider } from '../src/context/I18nContext';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <I18nProvider defaultLanguage="en">
        <Story />
      </I18nProvider>
    ),
  ],
};

export default preview;
```

### Story Examples with Different States

```typescript
// src/components/ItemCard/ItemCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ItemCard } from './ItemCard';

const meta: Meta<typeof ItemCard> = {
  title: 'Components/ItemCard',
  component: ItemCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ItemCard>;

// All possible states
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ItemCard
        name="Bottled Water (OK)"
        quantity={18}
        recommendedQuantity={18}
        unit="liters"
        status="ok"
        onEdit={() => {}}
        onDelete={() => {}}
      />
      <ItemCard
        name="Canned Soup (Low Quantity)"
        quantity={3}
        recommendedQuantity={12}
        unit="cans"
        status="warning"
        onEdit={() => {}}
        onDelete={() => {}}
      />
      <ItemCard
        name="Batteries (Expiring Soon)"
        quantity={20}
        recommendedQuantity={20}
        unit="pieces"
        expirationDate="2025-01-10"
        status="warning"
        onEdit={() => {}}
        onDelete={() => {}}
      />
      <ItemCard
        name="First Aid Kit (Expired)"
        quantity={1}
        recommendedQuantity={1}
        unit="pieces"
        expirationDate="2024-06-01"
        status="critical"
        onEdit={() => {}}
        onDelete={() => {}}
      />
      <ItemCard
        name="Flashlight (Missing)"
        quantity={0}
        recommendedQuantity={2}
        unit="pieces"
        status="critical"
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  ),
};

// Interactive playground
export const Playground: Story = {
  args: {
    name: 'Bottled Water',
    quantity: 15,
    recommendedQuantity: 18,
    unit: 'liters',
    expirationDate: '2025-06-15',
    status: 'warning',
  },
};

// Mobile viewport
export const Mobile: Story = {
  args: {
    name: 'Bottled Water',
    quantity: 15,
    recommendedQuantity: 18,
    unit: 'liters',
    status: 'warning',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Dark mode (if supported)
export const DarkMode: Story = {
  args: {
    name: 'Bottled Water',
    quantity: 15,
    recommendedQuantity: 18,
    unit: 'liters',
    status: 'warning',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
```

---

## Benefits of This Architecture

### 1. Storybook Development
- **Component Catalog** - Visual documentation of all UI components
- **Isolated Development** - Build components without running the whole app
- **Design System** - Ensures consistency across the app
- **Stakeholder Review** - Non-technical people can review UI
- **Interactive Testing** - Play with different props and states

### 2. Testing Advantages
```typescript
// Easy to test presentational components
describe('ItemCard', () => {
  test('displays item information', () => {
    render(
      <ItemCard
        name="Bottled Water"
        quantity={15}
        recommendedQuantity={18}
        unit="liters"
        status="warning"
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
    expect(screen.getByText(/15.*18.*liters/)).toBeInTheDocument();
  });
});
```

### 3. Reusability
```typescript
// Same component used in different contexts
<ItemCard {...props} />                    // Inventory page
<ItemCard {...props} size="compact" />     // Dashboard summary
<ItemCard {...props} showActions={false} /> // Read-only view
```

### 4. Maintainability
- Clear separation between UI and logic
- Easy to modify UI without touching business logic
- Easy to change logic without touching UI
- Components are self-documenting via Storybook

---

## State Management Strategy

### Context API for Global State
```typescript
// src/context/AppContext.tsx
interface AppContextValue {
  // State
  household: HouseholdConfig;
  items: InventoryItem[];
  settings: UserSettings;

  // Actions
  updateHousehold: (config: Partial<HouseholdConfig>) => void;
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management logic here
  // Load from LocalStorage
  // Provide methods to update state

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
```

### Custom Hooks for Derived State
```typescript
// src/hooks/useItemStatus.ts
export const useItemStatus = (itemId: string) => {
  const { items } = useApp();
  const { household } = useHousehold();

  const item = items.find(i => i.id === itemId);

  const recommendedQuantity = useMemo(
    () => item ? calculateRecommendedQuantity(item, household) : 0,
    [item, household]
  );

  const status = useMemo(
    () => item ? getItemStatus(item, recommendedQuantity, new Date()) : 'critical',
    [item, recommendedQuantity]
  );

  return { item, recommendedQuantity, status };
};
```

---

## Styling Strategy

### CSS Modules (Recommended)
```typescript
// src/components/Button/Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.2s;
}

.button--primary {
  background: var(--color-primary);
  color: white;
}

.button--secondary {
  background: var(--color-secondary);
  color: var(--color-text);
}

.button--danger {
  background: var(--color-danger);
  color: white;
}

.button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

```typescript
// src/components/Button/Button.tsx
import styles from './Button.module.css';

export const Button: React.FC<ButtonProps> = ({ variant, children, ...props }) => {
  return (
    <button
      className={`${styles.button} ${styles[`button--${variant}`]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Alternative: Styled Components or Tailwind
Both work well with Storybook, choose based on preference.

---

## Package.json Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@storybook/react": "^7.6.0",
    "@storybook/react-vite": "^7.6.0",
    "@storybook/addon-essentials": "^7.6.0",
    "@storybook/addon-interactions": "^7.6.0",
    "@storybook/addon-links": "^7.6.0",
    "@storybook/addon-a11y": "^7.6.0",
    "@storybook/testing-library": "^0.2.2",
    "storybook": "^7.6.0"
  },
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

---

## Development Workflow

### 1. Component-First Development
```
1. Create presentational component
2. Write Storybook stories (all states)
3. Test component in isolation
4. Create container component
5. Integrate into page
```

### 2. Storybook as Living Documentation
- Designers can review components
- Developers can see all available components
- QA can test different states visually
- Product can preview features

### 3. Visual Regression Testing
```typescript
// e2e/visual.spec.ts
test('ItemCard visual regression', async ({ page }) => {
  // Navigate to Storybook story
  await page.goto('http://localhost:6006/?path=/story/components-itemcard--all-states');

  // Take screenshot
  await expect(page).toHaveScreenshot('itemcard-all-states.png');
});
```

---

## Summary

### Architecture Benefits
✅ **Clear separation** - UI vs Logic
✅ **Storybook documentation** - Visual component catalog
✅ **Easy testing** - Test UI and logic separately
✅ **Reusability** - Pure components work anywhere
✅ **Design system** - Consistent UI across app
✅ **Developer experience** - Build components in isolation
✅ **Collaboration** - Designers/PMs can review in Storybook

### Component Split
- **~30-40 presentational components** (atoms, molecules, organisms)
- **~10-15 container components** (connect data to UI)
- **~5-10 page components** (route-level views)

### Tools
- **Storybook** - Component development and documentation
- **TypeScript** - Type safety for props
- **CSS Modules** - Scoped styling
- **React Testing Library** - Component testing
- **Playwright** - Visual regression testing

---

**Document Version**: 1.0
**Last Updated**: 2025-12-22
