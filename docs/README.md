# Documentation

This folder contains up-to-date documentation that reflects the current implementation of the Emergency Supply Tracker.

> **Note:** Original specifications are preserved in [specifications/](specifications/) for reference.

## Files

| Document                                     | Description                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| [DATA_SCHEMA.md](DATA_SCHEMA.md)             | TypeScript types and data structures                                                 |
| [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md)     | Features, user workflows, and UI components                                          |
| [RECOMMENDED_ITEMS.md](RECOMMENDED_ITEMS.md) | All 70 recommended emergency supply items                                            |
| [ARCHITECTURE.md](ARCHITECTURE.md)           | Complete application architecture (layered architecture, feature slices, components) |
| [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)       | Technology stack and project configuration                                           |
| [TESTING_STRATEGY.md](TESTING_STRATEGY.md)   | Testing approach, Vitest and Playwright setup                                        |
| [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) | Internationalization (i18n) implementation                                           |
| [CODE_QUALITY.md](CODE_QUALITY.md)           | ESLint, Prettier, and CI/CD configuration                                            |
| [CODE_COVERAGE.md](CODE_COVERAGE.md)         | Coverage thresholds, Codecov, and PR requirements                                    |

## Source of Truth

Each document references the source code files it documents:

- Types: `src/types/index.ts`
- Categories: `src/data/standardCategories.ts`
- Items: `src/data/recommendedItems.ts`
- Components: `src/components/`
- Dependencies: `package.json`

## Documentation Organization

### Planning Documents

Implementation plans, memos, and other planning documents should be placed in `docs/plans/` to keep them organized and separate from reference documentation.

## Keeping Documentation Updated

When making changes to the codebase, update the corresponding documentation file to keep them in sync.
