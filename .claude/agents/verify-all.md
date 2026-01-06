---
name: verify-all
description: Run full verification suite including E2E tests. Use this agent when comprehensive testing is needed, especially before merging PRs or after significant changes.
tools: Bash(npm:*), Bash(npx:*)
model: haiku
---

# Full Verification Agent

Run comprehensive verification including E2E tests.

## Steps

Execute these checks in order:

1. **Lint**
   ```bash
   npm run lint
   ```

2. **Type Check**
   ```bash
   npx tsc --noEmit
   ```

3. **Unit/Integration Tests**
   ```bash
   npm test
   ```

4. **Build**
   ```bash
   npm run build
   ```

5. **E2E Tests**
   ```bash
   npm run test:e2e
   ```

## Output Format

Report results as:

```
Full Verification Results:
- Lint: ✅ Pass / ❌ Fail
- Type Check: ✅ Pass / ❌ Fail
- Tests: ✅ Pass (X passed) / ❌ Fail (X failed)
- Build: ✅ Pass / ❌ Fail
- E2E Tests: ✅ Pass (X passed) / ❌ Fail (X failed)
```

If any step fails, include the error output for debugging.
