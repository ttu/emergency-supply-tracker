# Emergency Supply Tracker

A web-based emergency supply tracking application that helps households manage their emergency preparedness supplies based on recommendations from [72tuntia.fi](https://72tuntia.fi) (Finnish national preparedness guidelines). The application runs entirely in the browser with no backend storage.

## Features

### Core Features

- **Household Configuration**: Configure adults, children, supply duration, and freezer usage
- **9 Standard Categories**: Water & Beverages, Food, Cooking & Heat, Light & Power, Communication & Info, Medical & Health, Hygiene & Sanitation, Tools & Supplies, Cash & Documents
- **70 Recommended Items**: Based on 72tuntia.fi guidelines with automatic quantity calculations
- **Item Management**: Add, edit, delete, and track quantities and expiration dates
- **Status Indicators**: Visual indicators (OK / Warning / Critical) for supply status
- **Expiration Tracking**: Alerts for items expiring soon or already expired
- **Export/Import**: JSON data backup and restore
- **Shopping Lists**: Export to TXT, Markdown, or CSV formats
- **Product Templates**: Built-in and custom templates with barcode support
- **Bilingual Support**: Full support for English and Finnish (Suomi)
- **PWA Support**: Progressive Web App with offline support

### Optional Features (Disabled by Default)

- **Calorie Tracking**: Track nutritional content and daily calorie coverage
- **Power Management**: Calculate days of power from batteries and power banks
- **Advanced Water Tracking**: Separate tracking for drinking vs. hygiene water

## Tech Stack

- **React 19** + **TypeScript 5.9** + **Vite 7**
- **LocalStorage** (no backend required)
- **CSS Modules** for styling
- **Storybook** for component development
- **Vitest 4** + **React Testing Library** for integration tests (70% of test suite)
- **Playwright 1.57** for E2E tests (20% of test suite)
- **react-i18next** for internationalization

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ttu/emergency-supply-tracker.git
cd emergency-supply-tracker

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Example Data

Sample inventory exports are available in the [examples/](examples/) directory:

- **sample-inventory-family5-days3.json**: 5-person household (2 adults, 3 children) with 3-day supply
  - Contains 15 items with various states: full stock, low stock, and expiring items
  - Useful for testing alerts, preparedness scores, and expiration tracking

To use an example:

1. Start the app: `npm run dev`
2. Go to Settings → Import Data
3. Upload the example JSON file from the `examples/` directory

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run storybook        # Start Storybook component explorer

# Testing
npm run test            # Run Vitest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run Playwright E2E tests
npm run test:e2e:ui     # Run E2E tests in UI mode
npm run test:a11y       # Run accessibility tests

# Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # TypeScript type checking
npm run validate:i18n   # Validate translation files

# Build
npm run build           # Production build
npm run preview         # Preview production build
npm run build-storybook # Build Storybook static site

# Quality Gates (run before commit)
npm run validate        # Format check + lint + test + build
npm run validate:all    # All checks including E2E tests
```

### Code Quality

The project uses:

- **ESLint** for linting (zero warnings policy)
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Husky** + **lint-staged** for pre-commit hooks
- **Vitest** for unit and integration tests
- **Playwright** for E2E tests
- **vitest-axe** and **@axe-core/playwright** for accessibility testing

### Testing Strategy

We use the **Testing Diamond** approach:

- **70% Integration Tests**: Vitest + React Testing Library
- **20% E2E Tests**: Playwright
- **10% Unit Tests**: Pure business logic

See [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) for details.

## Building

```bash
# Production build
npm run build

# Output will be in the `dist/` directory
```

## Deployment

### GitHub Pages

The app is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

- **Configuration**: Settings → Pages → Source: GitHub Actions
- **Workflow**: `.github/workflows/deploy.yml`
- **Visit**: `https://ttu.github.io/emergency-supply-tracker/`

### Alternative: Render.com

1. Configure build command: `npm run build`
2. Configure publish directory: `dist`
3. Set environment variable: `VITE_BASE_PATH=/`

## Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Follow the code style**:
   - Run `npm run format` before committing
   - Ensure `npm run lint` passes with zero warnings
   - Write tests for new features
3. **Test your changes**:
   - Run `npm run validate` to ensure all checks pass
   - For E2E changes, run `npm run test:e2e`
4. **Commit your changes**:
   - Use conventional commit messages (see below)
   - Pre-commit hooks will run linting and formatting automatically
5. **Push and create a Pull Request**

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type: description

- Detail 1
- Detail 2

Refs: #issue-number
```

**Types:**

- `feat`: New features
- `fix`: Bug fixes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `style`: Code style/formatting
- `chore`: Dependencies, tooling, misc tasks
- `ci`: CI/CD configuration changes

**Example:**

```
feat: add expiring items alert to dashboard

- Create AlertBanner component
- Add Storybook stories
- Integrate with Dashboard
- Add Finnish translations

Refs: #12
```

### Code Review Checklist

Before submitting a PR, ensure:

- ✅ TypeScript types are correct and complete
- ✅ Follows component architecture (presentational vs container)
- ✅ Has appropriate test coverage
- ✅ Accessible (WCAG 2.1 Level AA)
- ✅ Responsive (mobile and desktop)
- ✅ i18n - no hardcoded strings
- ✅ Performance - memoization where needed
- ✅ Error handling
- ✅ Storybook stories for presentational components
- ✅ JSDoc comments for complex logic

### Documentation

When adding new features:

- Update relevant documentation in `docs/`
- Keep `docs/DATA_SCHEMA.md` in sync with type changes
- Update `docs/FUNCTIONAL_SPEC.md` for new features
- Add examples to Storybook stories

See [docs/README.md](docs/README.md) for documentation structure.

### Getting Help

- Check the [documentation](docs/) folder
- Review existing similar components
- Run Storybook to see component examples
- Check test files for usage patterns
- Open an issue for questions or bugs

## Documentation

Comprehensive documentation is available in the `docs/` folder:

| Document                                          | Description                            |
| ------------------------------------------------- | -------------------------------------- |
| [DATA_SCHEMA.md](docs/DATA_SCHEMA.md)             | TypeScript types and data structures   |
| [FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md)     | Features, workflows, and UI components |
| [RECOMMENDED_ITEMS.md](docs/RECOMMENDED_ITEMS.md) | All 70 recommended items               |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)           | Application architecture               |
| [TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)       | Technology stack and configuration     |
| [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)   | Testing approach                       |
| [TRANSLATION_GUIDE.md](docs/TRANSLATION_GUIDE.md) | Internationalization (i18n)            |
| [CODE_QUALITY.md](docs/CODE_QUALITY.md)           | ESLint, Prettier, CI/CD                |
| [CODE_COVERAGE.md](docs/CODE_COVERAGE.md)         | Coverage thresholds and requirements   |

## License

MIT License

Copyright (c) 2026 Tomi Tuhkanen

See [LICENSE](LICENSE) for details.

## Status

🚧 **V0.1.0** - Work in progress

The application is actively being developed.

## Links

- **Repository**: https://github.com/ttu/emergency-supply-tracker
- **Issues**: https://github.com/ttu/emergency-supply-tracker/issues
- **72tuntia.fi**: https://72tuntia.fi (Finnish national preparedness guidelines)
