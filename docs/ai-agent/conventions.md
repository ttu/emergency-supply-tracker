# Project Conventions (AI Agent Reference)

See [ARCHITECTURE.md](../ARCHITECTURE.md) for full structure. Summary:

## Component Naming

- **Feature Components**: `ItemCard`, `CategoryGrid`, `AlertBanner` (in `src/features/[feature]/components/`)
- **Shared Components**: `Button`, `Modal`, `Badge`, `Input` (in `src/shared/components/`)
- **Layout Components**: `Header`, `Footer`, `Layout` (in `src/components/layout/`)
- **Pages**: `Dashboard`, `Inventory`, `Settings` (in `src/features/[feature]/pages/`)
- **Hooks**: `useInventory`, `useHousehold`, `useSettings` (in `src/features/[feature]/hooks/`)

## File Organization (Feature Slice)

```
src/
├── features/[feature]/
│   ├── components/   [Component].tsx, .stories.tsx, .test.tsx, .module.css
│   ├── hooks/
│   ├── utils/
│   ├── context.ts, provider.tsx, index.ts
├── shared/           components, hooks, utils, contexts, types
└── components/layout/
```

## Test Naming

- Unit: `[function].test.ts`
- Component: `[Component].test.tsx`
- E2E: `[feature].spec.ts`

## Translation Keys

Pattern: `category.subcategory.key`. Example: `dashboard.alerts.expiring`.
