# Code Coverage

This project uses automated code coverage monitoring to ensure all new functionality is properly tested.

## Coverage Requirements

### Project-Level Thresholds (Vitest)

The following thresholds are enforced locally via Vitest configuration:

| Metric     | Threshold |
| ---------- | --------- |
| Branches   | 80%       |
| Functions  | 80%       |
| Lines      | 80%       |
| Statements | 80%       |

### PR-Level Requirements (Codecov)

- **Project coverage**: Must not decrease (1% tolerance for fluctuation)
- **Patch coverage**: New/modified code must have ≥80% coverage

## Running Coverage Locally

### Generate Coverage Report

```bash
npm run test:coverage
```

This runs Vitest with coverage collection and generates reports in the `coverage/` directory.

### View HTML Report

After running coverage, open the HTML report:

```bash
open coverage/lcov-report/index.html
```

Or on Linux:

```bash
xdg-open coverage/lcov-report/index.html
```

### Watch Mode (No Coverage)

For development, use watch mode without coverage for faster feedback:

```bash
npm run test:watch
```

## CI/CD Integration

Coverage is automatically collected and reported on every push and pull request:

1. **Vitest runs with coverage** during the `test` job
2. **Coverage is uploaded to Codecov** for analysis
3. **Codecov posts a comment** on PRs showing coverage changes
4. **Status checks** block PRs that don't meet coverage requirements

## Guidelines for New Code

### Ensure New Features Are Tested

When adding new functionality:

1. Write tests alongside the code
2. Run `npm run test:coverage` to verify coverage
3. Check that new files have adequate coverage in the report
4. Aim for ≥80% coverage on new code (enforced by Codecov)

### What to Test

Following the Testing Diamond approach:

- **Integration tests (70%)**: Test components with their hooks, state, and user interactions
- **E2E tests (20%)**: Test critical user journeys (Playwright)
- **Unit tests (10%)**: Test complex pure functions and calculations

### Files Excluded from Coverage

The following are excluded from coverage metrics:

- Type definition files (`*.d.ts`)
- Entry point (`src/main.tsx`)
- Test files (`src/test/**`)

## Viewing Coverage in PRs

When you open a PR, Codecov will:

1. Compare coverage to the base branch
2. Post a comment showing:
   - Overall coverage change
   - Coverage for changed files
   - Lines that aren't covered
3. Set a status check (pass/fail)

## Troubleshooting

### Coverage is Below Threshold

If Vitest fails due to coverage thresholds:

1. Run `npm run test:coverage` locally
2. Open the HTML report to identify uncovered code
3. Add tests for the uncovered lines/branches
4. Re-run coverage to verify

### Codecov Status Check Failing

If the Codecov check fails on a PR:

- **Project coverage decreased**: Add tests for existing code that lost coverage
- **Patch coverage below 80%**: Add tests for your new/modified code

Check the Codecov comment on the PR for specific files and lines that need coverage.
