# Emergency Supply Tracker - Specifications Index

## Project Overview

A web-based emergency supply tracking application that helps households manage their emergency preparedness supplies based on recommendations from [72tuntia.fi](https://72tuntia.fi) (Finnish national preparedness guidelines). The application runs entirely in the browser with no backend storage.

**Status:** Planning Phase - V1 Specification Complete
**Last Updated:** 2025-12-22

## Quick Links

### Core Specifications

📋 **[FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md)** - *What the app does*
- User workflows and features
- Application views and UI
- Data management (import/export)
- Internationalization
- Design considerations
- Success metrics

🔧 **[TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)** - *How it's built*
- Technology stack and architecture
- Component patterns
- Testing strategy (Testing Diamond)
- CI/CD pipeline
- Deployment (GitHub Pages)
- Performance budgets
- Security considerations

### Data & Schema

📊 **[DATA_SCHEMA.md](DATA_SCHEMA.md)** - *Data structures*
- LocalStorage schema
- TypeScript interfaces
- Translation file structure
- Calculated fields
- Export/import format
- Migration strategy

📦 **[RECOMMENDED_ITEMS.md](RECOMMENDED_ITEMS.md)** - *Product catalog*
- 70 recommended items
- 9 standard categories
- Scaling rules
- Default expiration periods

### Development Guides

🧪 **[TESTING_STRATEGY.md](TESTING_STRATEGY.md)** - *Testing approach*
- Testing Diamond (70% integration, 20% E2E, 10% unit)
- Jest + React Testing Library
- Playwright E2E configuration
- Coverage thresholds

🧩 **[COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)** - *Component patterns*
- Presentational vs Container components
- Pure components for Storybook
- Custom hooks for business logic
- Example implementations

✅ **[CODE_QUALITY.md](CODE_QUALITY.md)** - *Code quality & CI/CD*
- ESLint, Prettier, TypeScript configs
- Husky + lint-staged
- GitHub Actions workflows
- Deployment setup

🌍 **[TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)** - *Internationalization*
- Built-in vs custom templates
- Translation file structure
- English + Finnish examples
- Search implementation

### Design & UX

🎨 **[UX_DECISIONS.md](UX_DECISIONS.md)** - *UX & implementation decisions*
- Onboarding flow (Quick Setup)
- Help system and tooltips
- Edge case handling
- Accessibility (WCAG 2.1 AA)
- PWA and offline support
- Household presets
- Analytics and error logging

### Analysis Documents

📑 **[SUBCATEGORIES_ANALYSIS.md](SUBCATEGORIES_ANALYSIS.md)** - *Category system*
- 9 main categories
- 30 subcategories from old schema
- Mapping and recommendations
- UI enhancement ideas

## Key Features

### V1 Core Features

- ✅ **Household Configuration**: Adults, children, supply duration, freezer
- ✅ **9 Standard Categories**: Water, food, cooking, light, communication, medical, hygiene, tools, cash
- ✅ **70 Recommended Items**: Based on 72tuntia.fi guidelines
- ✅ **Item Management**: Add, edit, delete, track quantities and expiration
- ✅ **Status Indicators**: OK / Warning / Critical
- ✅ **Export/Import**: JSON data backup
- ✅ **Shopping List**: Export to TXT/Markdown/CSV
- ✅ **Bilingual**: English + Finnish
- ✅ **Product Templates**: Built-in + custom templates with barcode support

### V1 Optional Features (Disabled by Default)

- ⚙️ **Calorie Tracking**: Track nutritional content
- ⚙️ **Power Management**: Calculate days of power from batteries
- ⚙️ **Advanced Water Tracking**: Separate drinking vs hygiene water

### V2 Future Enhancements

- 📍 Multi-location support (home, cabin, car)
- 🐕 Pet support (food, medication)
- 📱 PWA with offline support
- 🔔 Recurring check reminders
- 📊 Item history tracking
- 🌐 Crowdsourced product catalog

## Technology Stack

**Frontend:**
- React 19.x + TypeScript 5.x
- Vite 7.x (build tool)
- CSS Modules (styling)

**Storage:**
- Browser LocalStorage (no backend)
- JSON import/export

**Testing:**
- Jest 30.x + React Testing Library (70%)
- Playwright 1.57.x (20% E2E)
- Testing Diamond approach

**CI/CD:**
- GitHub Actions
- Deployment: GitHub Pages or Render.com

**Languages:**
- English (default)
- Finnish (Suomi)

## Project Structure

```
emergency-supply-tracker/
├── docs/
│   └── specifications/          # ← You are here
│       ├── SPECIFICATIONS.md    # This index
│       ├── FUNCTIONAL_SPEC.md   # User features
│       ├── TECHNICAL_SPEC.md    # Architecture
│       ├── DATA_SCHEMA.md       # Data structures
│       ├── RECOMMENDED_ITEMS.md # Product catalog
│       ├── TESTING_STRATEGY.md  # Testing approach
│       ├── COMPONENT_ARCHITECTURE.md
│       ├── CODE_QUALITY.md      # Tools & CI/CD
│       ├── TRANSLATION_GUIDE.md # i18n guide
│       └── SUBCATEGORIES_ANALYSIS.md
├── src/                         # Source code (future)
├── e2e/                         # E2E tests (future)
├── .github/workflows/           # CI/CD (future)
└── package.json                 # Dependencies (future)
```

## Getting Started

### For Product Managers / Designers
👉 Start with [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md)
- Understand user workflows
- Review UI/UX requirements
- See export formats

### For Developers
👉 Start with [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)
- Understand architecture decisions
- Review tech stack
- See CI/CD setup

Then read:
- [DATA_SCHEMA.md](DATA_SCHEMA.md) - Data structures
- [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - Component patterns
- [TESTING_STRATEGY.md](TESTING_STRATEGY.md) - Testing approach

### For Translators
👉 Start with [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)
- See translation file structure
- Review examples (EN/FI)
- Understand built-in vs custom templates

### For QA / Testers
👉 Start with [TESTING_STRATEGY.md](TESTING_STRATEGY.md)
- Review testing diamond approach
- See example test cases
- Understand coverage requirements

Then read:
- [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md) - Features to test
- [CODE_QUALITY.md](CODE_QUALITY.md) - Quality gates

## References

- [72tuntia.fi](https://72tuntia.fi/) - Finnish emergency preparedness guidelines
- Finnish civil defense recommendations
- Red Cross emergency preparedness standards
- FEMA preparedness resources

## Implementation

📋 **[IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)** - *Atomic, committable implementation steps*
- Step-by-step guide for agent execution
- Each step: builds, tests pass, deployable
- One commit per step
- Estimated timeline: 40 working days (8 weeks)
- Covers: Setup → Data Layer → UI → PWA → Release
- Deployment: GitHub Pages or Render.com (user configures)

**Current Phase:** ✅ Planning Complete → Ready for Implementation
**Next Step:** Step 0 - Initialize Project

## Contributing

This project is in the planning phase. All specifications are complete and ready for implementation.

**Status:** Specifications finalized, implementation ready to begin

## License

TBD (To be determined during implementation)

---

**Document Version**: 2.0
**Last Updated**: 2025-12-22
**Status**: Planning Phase - Specifications Split into Functional + Technical

**Changelog**:
- v2.0: Split into FUNCTIONAL_SPEC and TECHNICAL_SPEC
- v1.3: Added product templates and barcode scanning
- v1.2: Added advanced optional features
- v1.1: Added freezer support
- v1.0: Initial specification
