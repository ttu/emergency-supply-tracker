---
description: Run verification checks (lint, test, type-check, build)
allowed-tools: Bash(npm:*), Bash(npx:*)
---

# Verify Codebase

Run all verification checks to ensure code quality.

## Instructions

Run these checks in order (stop on first failure unless `$ARGUMENTS` contains "all"):

1. **Lint** - Check code style
   ```bash
   npm run lint
   ```

2. **Type Check** - Verify TypeScript types
   ```bash
   npx tsc --noEmit
   ```

3. **Tests** - Run test suite
   ```bash
   npm test
   ```

4. **Build** - Verify production build
   ```bash
   npm run build
   ```

## Output

Report results in this format:

```
Verification Results:
- Lint: ✅ Pass / ❌ Fail
- Type Check: ✅ Pass / ❌ Fail
- Tests: ✅ Pass (X passed) / ❌ Fail (X failed)
- Build: ✅ Pass / ❌ Fail
```

## Arguments

- No arguments: Stop on first failure
- `all`: Run all checks even if some fail
- `quick`: Only run lint and type-check (skip tests and build)
- `test`: Only run tests
