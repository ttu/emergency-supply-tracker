# AI Collaboration Tips & Pitfalls

## Tips

1. **Provide context** – Mention which part of the project you're working on.
2. **Reference specs** – Point to docs (e.g. DATA_SCHEMA.md, ARCHITECTURE.md).
3. **Show examples** – Include existing code patterns ("Similar to ItemCard...").
4. **Be specific about testing** – e.g. "Write integration tests that verify the component displays correct data when household changes", not just "add tests".
5. **Iterate incrementally** – Break large features into smaller tasks (presentational component → container → E2E).

## Pitfalls

### ❌ Don't Ask For

- "Create the entire app" – Use implementation plans step-by-step instead.
- Backend features – Frontend-only app.
- IndexedDB – We use LocalStorage.
- Complex state libraries – We use Context API.
- CSS-in-JS or Tailwind – We use CSS Modules.
- Unit tests for every function – We use Testing Diamond (70% integration, 20% E2E, 10% unit).

### ✅ Do Ask For

- Step-by-step implementation from plans (e.g. "Implement Step 5").
- Specific components following our architecture.
- Storybook stories for presentational components.
- Business logic with comprehensive tests.
- Integration tests (70%), E2E for critical flows (20%).
- Translations for new features (English + Finnish).
- PWA features (manifest, service worker, offline).
