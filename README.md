# Emergency Supply Tracker

A web-based emergency supply tracking application that helps households manage their emergency preparedness supplies based on recommendations from [72tuntia.fi](https://72tuntia.fi) (Finnish national preparedness guidelines). The application runs entirely in the browser with no backend storage.

## Features

### Core Features

- **Household Configuration**: Configure adults, children, pets, supply duration, and freezer usage
- **10 Standard Categories**: Water & Beverages, Food, Cooking & Heat, Light & Power, Communication & Info, Medical & Health, Hygiene & Sanitation, Tools & Supplies, Cash & Documents, Pets
- **81 Recommended Items**: Based on 72tuntia.fi guidelines with automatic quantity calculations
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

### Dev Container (optional)

The repo ships a [dev container](.devcontainer/devcontainer.json) with Node 20, Playwright, and the
Claude Code CLI preinstalled. Open the folder in VS Code and choose **Reopen in Container** — `npm ci`,
the Playwright browsers, and a guardrail self-check all run automatically.

It is based on `mcr.microsoft.com/playwright:v1.57.0-noble` — the same image
`npm run test:e2e:visual:docker` uses — so **visual regression tests run natively inside the container
and match the committed `*-chromium-linux.png` baselines**. Node is pinned to 20 to match CI, even
though that image ships Node 24. When bumping Playwright, bump the image tag in
`.devcontainer/docker-compose.yml` too.

Ports 5173 (dev server), 4173 (preview), 6006 (Storybook), and 9323 (Playwright report) are forwarded
to the host.

#### Using it with git worktrees

One container per worktree — which pairs neatly with the branch confinement below, since each
container is then inherently a single branch:

```bash
./new-worktree.sh --container feat-my-thing   # --container skips the host npm install
code .worktrees/feat-my-thing                 # then: Reopen in Container
```

A worktree's `.git` is a _file_ holding an absolute path into the main repo's `.git`, which would not
exist inside a container — git is simply broken there without help. So `initializeCommand` runs
`.devcontainer/initialize.sh` on the host, which records two paths in `.devcontainer/.env`
(gitignored) for docker-compose to bind-mount **at their original absolute paths**:

- `GIT_COMMON_DIR` — the shared `.git`, so the worktree's `gitdir:` pointer resolves.
- `LOCAL_WORKSPACE_FOLDER` — the worktree itself. The main repo records this path, and if it is not
  visible git marks the worktree _prunable_; a `git gc` would then delete the shared admin directory
  and break the worktree **on the host too**.

Nothing in your host repo is modified, so `new-worktree.sh` and existing worktrees keep working.

The repo's _other_ worktrees are deliberately not mounted, so inside the container they do look
prunable. Automatic gc is therefore disabled (`gc.auto=0`, set via `GIT_CONFIG_*` env so no shared
config file is touched), and `git gc` / `git worktree prune` are blocked outright by the guardrail
hook. Run those from the host.

Playwright browsers live in a shared `est-playwright-browsers` volume so each new worktree does not
re-download ~500MB; `node_modules` stays per-worktree, since branches diverge in dependencies.

### Git guardrail for AI agents

[`.claude/hooks/block-dangerous-git.sh`](.claude/hooks/block-dangerous-git.sh) is a `PreToolUse` hook
that limits what Claude's Bash tool may do with git. The line is **reversible vs. not**, rather than
read vs. write — agents can do normal development work, but not damage:

| Allowed                                                                | Blocked                                                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `git commit`, `git push` to a feature branch, `rebase`, `merge`, `tag` | `push --force` / `--force-with-lease`, push to `main`/`master`, `push --delete`         |
| `gh pr create`, `gh pr edit`, `gh issue create`                        | `gh pr merge` / `close`, `gh release`, `gh repo delete`, `gh secret`, `gh workflow run` |
| all read-only `git` / `gh` commands                                    | `reset --hard`, `clean -f`, `checkout .`, `restore .`, `branch -D`, `filter-branch`     |
| —                                                                      | `git gc`, `git worktree prune` (would corrupt the repo's other worktrees — see above)   |

GitHub branch protection on `main` is the real backstop; this hook stops an agent from getting that
far by accident. It only gates the agent — you can run anything yourself.

**Inside the dev container, the agent is confined to the branch the container was created on.**
`post-create.sh` records that branch, and on top of the rules above the container additionally blocks:

- pushing any other branch — the explicit target if the command names one, otherwise the current
  branch, so switching branches first does not get around it;
- leaving that branch (`git checkout <ref>`, `git switch`, `-b`/`-c`), while `git checkout -- <file>`
  and path arguments still work;
- rewriting other branches locally — `git branch -f/-m/-c`, `git fetch|pull <remote> main:main`
  (a refspec writes local refs directly), `git worktree add`, `git symbolic-ref`;
- repointing remotes (`git remote set-url`).

None of this exists on the host, so normal multi-branch work there is unaffected. Anything the
container refuses can be done from the host.

Two implementation details worth knowing:

- **It fails closed.** Unparseable input is blocked, not allowed. It prefers `jq` and falls back to
  `node`, because the base image ships neither `jq` nor any guarantee of it — the upstream script this
  came from silently allowed _everything_ when `jq` was missing.
- **It normalizes before matching**, so quoting and shell nesting can't smuggle a command past it
  (`bash -c "git push --force"`, `$(git push --force)`, `eval '…'`), and matching is
  case-insensitive.

`.devcontainer/post-create.sh` self-tests the hook during container creation, so **setup fails loudly
if the guardrail is not working**.

To let `gh` read issues and open PRs, forward a token before opening the container
(`gh` keeps its own credentials in the OS keychain, which the container cannot reach):

```bash
export GH_TOKEN=$(gh auth token)
export CLAUDE_CODE_OAUTH_TOKEN=...   # optional: reuse your host Claude Code login
```

`GH_TOKEN` should be scoped to only this repo and only to pull request / issue
permissions — the container only ever needs `gh pr create`, `gh pr edit`, and
`gh issue create` (see the guardrail table above). Prefer a fine-grained
[personal access token](https://github.com/settings/personal-access-tokens) limited to this
repository with **Contents: Read**, **Issues: Read and write**, and **Pull requests: Read and
write**, rather than `gh auth token`, which inherits your host `gh` login's full scope across
every repo you can access.

Because the container is isolated and destructive git operations are blocked, you can also skip
Claude Code's permission prompts by adding this to `.claude/settings.local.json` (gitignored, so it
stays per-developer):

```json
{ "permissions": { "defaultMode": "bypassPermissions" } }
```

Note that this file is bind-mounted from the repo, so the setting applies on the host too — only set
it if you're comfortable with that.

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
