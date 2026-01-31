# Version Control & PR Workflow

**Cursor / AI agents:** Use `required_permissions: ['all']` for `git push` and `gh pr create` (sandbox bypass).

## Commit Message Format

```
type: description

- Detail 1
- Detail 2

Refs: #issue-number
```

- **Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `ci`, `build`, `perf`
- **Rules:** No "Co-Authored-By" or "Generated with" footers. No scopes (use `feat:` not `feat(scope):`).
- **Implementation steps:** Use conventional types (`chore` setup, `feat` functionality, etc.) instead of "Step X:".

## PR

Use `/pr-create` and `/pr-fix` (pr commands).
