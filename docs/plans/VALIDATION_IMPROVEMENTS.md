# Validation Improvements for Agent-Generated Code

> **Purpose**: Recommendations for better validating functionality added by AI agents
> **Status**: Proposal
> **Last Updated**: 2026-01-03

This document outlines improvements to the validation infrastructure to ensure agent-generated code is thoroughly tested and verified.

---

## Current State

### ✅ What We Have

- **Pre-commit hooks**: ESLint, Prettier, Vitest tests, build check
- **CI Pipeline**: Lint, test (with coverage), Storybook, E2E (Chromium), build
- **Coverage tracking**: Codecov with 80% thresholds
- **Mutation testing**: Stryker (local only)
- **TypeScript**: Strict mode enabled
- **E2E tests**: Critical user flows covered

### ⚠️ Gaps Identified

1. **Type checking** - Not explicitly validated in CI (only via build)
2. **Accessibility** - No automated a11y checks
3. **Visual regression** - No visual diff testing
4. **Performance** - No performance budgets or Lighthouse CI
5. **Bundle size** - No bundle size monitoring
6. **i18n validation** - No checks for missing translations
7. **PWA validation** - No automated PWA checks
8. **Multi-browser E2E** - Only Chromium in CI
9. **Smoke tests** - No fast feedback suite
10. **Pre-push hooks** - Only pre-commit validation

---

## Recommended Improvements

### Priority 1: High Impact, Low Effort

#### 1.1 Explicit Type Checking in CI

**Problem**: TypeScript errors might only be caught during build, not as a separate validation step.

**Solution**: Add explicit `tsc --noEmit` step in CI.

**Implementation**:

- Add `type-check` script to `package.json`
- Add type-check job to CI workflow
- Run before tests (fail fast on type errors)

**Files to modify**:

- `package.json` - Add `"type-check": "tsc --noEmit"`
- `.github/workflows/ci.yml` - Add type-check job

---

#### 1.2 Accessibility Testing in CI

**Problem**: No automated accessibility checks. Agents might introduce a11y issues.

**Solution**: Add automated a11y testing with `vitest-axe` for component-level tests and `@axe-core/playwright` for E2E tests.

**Implementation**:

- Add `vitest-axe` for component-level a11y tests (native Vitest support)
- Add `@axe-core/playwright` for E2E a11y checks
- Create a11y test suite for critical components
- Add separate a11y job to CI (runs independently from e2e job)
- **Important**: Configure Vitest to use `jsdom` environment (not `happy-dom`) due to the `isConnected` bug in happy-dom that breaks axe-core

**Files to create**:

- `src/test/a11y-setup.ts` - Vitest a11y setup (imports from `vitest-axe/matchers`)
- `e2e/a11y.spec.ts` - E2E a11y tests

**Files to modify**:

- `package.json` - Add `vitest-axe` and `@axe-core/playwright` dependencies
- `vite.config.ts` - Ensure test environment is `jsdom` (required for axe-core)
- `playwright.config.ts` - Exclude `a11y.spec.ts` from default e2e run
- `.github/workflows/ci.yml` - Add separate a11y job

**Note**: `a11y.spec.ts` is excluded from the default E2E test run to avoid duplication. The a11y tests run in a separate CI job. This separation allows:

- E2E tests to focus on functionality
- A11y tests to run independently and be easily identified in CI
- Faster feedback when only one type of test fails

---

#### 1.3 Pre-push Hook for Full Validation

**Problem**: Pre-commit runs lint/format, type-check, tests, and build, but full validation suite (including E2E) happens in CI, which is slower feedback.

**Current State**: Type-check has been added to the existing pre-commit hook (`.husky/pre-commit`) as an interim step. The pre-commit hook now runs: lint-staged → type-check → test → build.

**Solution**: Add a separate pre-push hook that runs the full validation suite.

**Implementation**:

- Create `.husky/pre-push` hook
- Run `npm run validate` (format:check + lint + test + build)
- Optional: Run E2E tests (can be slow, make it optional with flag)

**Files to create**:

- `.husky/pre-push` - Pre-push validation script

**Note**: Make it skippable with `--no-verify` for emergency fixes. This is separate from the pre-commit hook which already includes type-check.

---

#### 1.4 i18n Translation Validation

**Problem**: Agents might add hardcoded strings or forget translations.

**Solution**: Add script to validate translation completeness.

**Implementation**:

- Create script to check for missing translation keys
- Validate that all user-facing strings use i18n
- Check for unused translation keys
- Add to CI lint job

**Files to create**:

- `scripts/validate-i18n.ts` - i18n validation script

**Files to modify**:

- `package.json` - Add `validate:i18n` script
- `.github/workflows/ci.yml` - Add to lint job

---

### Priority 2: High Impact, Medium Effort

#### 2.1 Visual Regression Testing

**Problem**: UI changes might break visual appearance without breaking functionality.

**Solution**: Add visual regression testing with Chromatic or Percy.

**Implementation**:

- Integrate Chromatic (already have `@chromatic-com/storybook`)
- Add visual tests for critical components
- Run visual tests in CI on PRs
- Review visual diffs before merge

**Files to modify**:

- `.github/workflows/ci.yml` - Add Chromatic visual tests job
- Storybook stories - Add visual test annotations

**Note**: Chromatic is already installed, just needs CI integration.

---

#### 2.2 Bundle Size Monitoring

**Problem**: Agents might add large dependencies or bundle bloat.

**Solution**: Add bundle size monitoring with `bundlesize` or `size-limit`.

**Implementation**:

- Add `size-limit` or `bundlesize` package
- Set size budgets for main bundle
- Fail CI if bundle size increases beyond threshold
- Track bundle size over time

**Files to create**:

- `.size-limit.json` - Bundle size configuration

**Files to modify**:

- `package.json` - Add size-limit script
- `.github/workflows/ci.yml` - Add bundle size check job

---

#### 2.3 Multi-Browser E2E Testing in CI

**Problem**: Currently only Chromium is tested in CI. Other browsers might have issues.

**Solution**: Run E2E tests on multiple browsers in CI (at least Firefox and WebKit).

**Implementation**:

- Update CI to run E2E on Chromium, Firefox, WebKit
- Use matrix strategy to parallelize
- Keep mobile tests optional (run on main branch only)

**Files to modify**:

- `.github/workflows/ci.yml` - Add matrix strategy for browsers

**Note**: This will increase CI time, but catches browser-specific issues.

---

#### 2.4 Performance Budget with Lighthouse CI

**Problem**: No performance validation. Agents might introduce performance regressions.

**Solution**: Add Lighthouse CI to measure and enforce performance budgets.

**Implementation**:

- Add `@lhci/cli` package
- Configure Lighthouse CI with performance budgets
- Run Lighthouse tests on critical pages
- Fail CI if budgets are exceeded

**Files to create**:

- `.lighthouserc.json` - Lighthouse CI configuration

**Files to modify**:

- `package.json` - Add lighthouse CI script
- `.github/workflows/ci.yml` - Add Lighthouse job

---

### Priority 3: Medium Impact, Various Effort

#### 3.1 Smoke Test Suite

**Problem**: Full test suite is slow. Need fast feedback for critical paths.

**Solution**: Create a fast smoke test suite that validates core functionality.

**Implementation**:

- Create `e2e/smoke.spec.ts` with critical path tests
- Run smoke tests first in CI (fail fast)
- Keep full E2E suite for comprehensive validation

**Files to create**:

- `e2e/smoke.spec.ts` - Fast smoke tests

**Files to modify**:

- `package.json` - Add `test:smoke` script
- `.github/workflows/ci.yml` - Add smoke test job (runs before full E2E)

---

#### 3.2 PWA Validation

**Problem**: PWA features (service worker, manifest) might break without notice.

**Solution**: Add automated PWA validation checks.

**Implementation**:

- Use `@pwabuilder/pwainstall` or Lighthouse PWA audit
- Validate service worker registration
- Validate manifest.json structure
- Check offline functionality

**Files to create**:

- `e2e/pwa.spec.ts` - PWA validation tests

**Files to modify**:

- `.github/workflows/ci.yml` - Add PWA validation job

---

#### 3.3 Calculation Validation Tests

**Problem**: Business logic calculations are critical but might have edge cases.

**Solution**: Create dedicated calculation validation test suite with known-good examples.

**Implementation**:

- Create `src/utils/calculations/validation.test.ts`
- Add test cases with expected results for all calculation functions
- Include edge cases and boundary conditions
- Run as part of unit test suite

**Files to create**:

- `src/utils/calculations/validation.test.ts` - Calculation validation tests

---

#### 3.4 Data Migration Testing

**Problem**: Data migrations might break existing user data.

**Solution**: Add tests for data migration paths.

**Implementation**:

- Create test fixtures for old data versions
- Test migration from each old version to current
- Validate data integrity after migration
- Test rollback scenarios

**Files to create**:

- `src/utils/storage/migration.test.ts` - Migration tests
- `src/test/fixtures/old-data-versions/` - Old data fixtures

---

#### 3.5 Test Result Reporting

**Problem**: Test failures in CI might not be immediately visible.

**Solution**: Improve test result visibility with better reporting.

**Implementation**:

- Use GitHub Actions annotations for test failures
- Upload test reports as artifacts
- Add test summary to PR comments (via action)
- Use Vitest's built-in reporters for better CI integration

**Files to modify**:

- `vite.config.ts` - Add Vitest reporter configuration
- `.github/workflows/ci.yml` - Add test result reporting

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)

1. ✅ Explicit type checking in CI
2. ✅ Pre-push hook for validation
3. ✅ i18n translation validation
4. ✅ Accessibility testing (basic)

### Phase 2: Important Additions (3-5 days)

1. ⏳ Visual regression testing (Chromatic)
2. ⏳ Bundle size monitoring
3. ⏳ Multi-browser E2E in CI
4. ⏳ Smoke test suite

### Phase 3: Nice to Have (1-2 weeks)

1. ⏳ Lighthouse CI performance budgets
2. ⏳ PWA validation
3. ⏳ Calculation validation tests
4. ⏳ Data migration testing
5. ⏳ Enhanced test reporting

> **Note**: For current implementation status and progress tracking, see [VALIDATION_PROGRESS.md](./VALIDATION_PROGRESS.md). That document is the source of truth for completion status (currently 4/13 completed - 31%).

---

## Validation Checklist for Agents

When agents add functionality, they should verify:

- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] All tests pass (`npm test`)
- [ ] Coverage thresholds met (`npm run test:coverage`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Formatting correct (`npm run format:check`)
- [ ] Accessibility checks pass (when implemented)
- [ ] Bundle size within budget (when implemented)
- [ ] Visual tests pass (when implemented)
- [ ] All translations present (when implemented)
- [ ] Performance budgets met (when implemented)

---

## Quick Reference

### New Scripts to Add

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "validate:i18n": "tsx scripts/validate-i18n.ts",
    "test:smoke": "playwright test e2e/smoke.spec.ts --project=chromium",
    "test:a11y": "vitest run --testPathPattern=a11y",
    "test:size": "size-limit",
    "test:lighthouse": "lhci autorun"
  }
}
```

### CI Job Order

```text
1. lint (fast) → Fail fast on code quality
2. type-check (fast) → Fail fast on type errors
3. test (medium) → Unit/integration tests
4. test:smoke (medium) → Critical path E2E
5. test:e2e (slow) → Full E2E suite
6. test:storybook (medium) → Component tests
7. test:a11y (medium) → Accessibility
8. test:size (fast) → Bundle size
9. test:lighthouse (slow) → Performance
10. build (medium) → Production build
```

---

## Notes

- **Balance speed vs. coverage**: Some checks are fast (lint, type-check), others are slow (E2E, Lighthouse). Order matters.
- **Make it skippable**: Pre-push hooks should be skippable with `--no-verify` for emergencies.
- **Progressive enhancement**: Start with Phase 1, add Phase 2/3 as needed.
- **Monitor CI time**: Adding more checks increases CI time. Use parallel jobs and caching.

---

## References

- [TypeScript Type Checking](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [vitest-axe](https://github.com/chaance/vitest-axe) (native Vitest support for axe-core)
- [Playwright Axe](https://github.com/abhinaba-ghosh/axe-playwright)
- [Chromatic Visual Testing](https://www.chromatic.com/docs/)
- [Size Limit](https://github.com/ai/size-limit)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
