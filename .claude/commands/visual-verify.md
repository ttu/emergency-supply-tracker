---
description: Run visual verification loop — takes screenshots, analyzes UI/UX, fixes issues autonomously
allowed-tools: Bash(npm:*), Bash(npx:*), Bash(kill:*), Bash(mkdir:*), Bash(lsof:*), Read, Write, Edit, Glob, Grep, mcp__playwright__*
---

# Visual Verification Loop

You MUST follow this procedure exactly. Zero tolerance — every issue found must be fixed before proceeding.

## Prerequisites

- Playwright MCP server is configured in `.mcp.json`
- The app can be started with `npm run dev`

## Procedure

### Phase 0: Setup

1. Create a session folder: `verification-sessions/YYYYMMDD-HHMMSS-{context}/` where `{context}` is a short description of what's being verified (e.g. `homepage`, `settings-page`, `post-refactor`)
2. Start the Vite dev server in background: `npm run dev` (record PID)
3. Write a `session.md` file in the session folder documenting: start time, what's being verified, services started with PIDs

### Phase 1: Homepage & Navigation Verification

**Repeat up to 2 times or until clean:**

1. Navigate to `http://localhost:5173/` using `browser_navigate`
2. Wait for page to fully load
3. Take a full-page screenshot → save to session folder as `phase1-homepage-{attempt}.png`
4. Read and analyze the screenshot for:
   - Layout problems (overlapping elements, broken grids, misaligned content)
   - Elements that are too narrow, too small, or cut off
   - Missing content or blank areas
   - Broken images or icons
   - Color/contrast issues
   - Typography problems
   - Responsive issues
5. Check `browser_console_messages` for errors or warnings
6. Click through main navigation links, take screenshots of each page
7. Save all screenshots to session folder with descriptive names

**If ANY issue found:** Document it in `session.md`, fix the code, restart if needed, go back to step 1.

### Phase 2: Interactive Features Verification

**Repeat up to 2 times or until clean:**

1. Test all interactive elements: dropdowns, buttons, filters, modals, sorting
2. Take screenshots before and after interactions
3. Verify hover states, active states, transitions
4. Check for UX problems: confusing flows, missing feedback, broken interactions
5. Check console for runtime errors

**If ANY issue found:** Document it, fix it, repeat.

### Phase 3: Responsive / Viewport Verification

**Repeat up to 2 times or until clean:**

1. Resize viewport to mobile (375x812): `browser_resize`
2. Take screenshots of key pages at mobile size
3. Resize to tablet (768x1024), take screenshots
4. Resize back to desktop (1280x900), take screenshots
5. Check for: horizontal scroll, truncated text, overlapping elements, touch target sizes, readable text

**If ANY issue found:** Document it, fix it, repeat.

### Phase 4: Final Summary

1. Write a `summary.md` in the session folder with:
   - Total issues found and fixed
   - Screenshots taken
   - Final status: PASS or FAIL
   - List of all changes made
2. Stop the dev server (kill the PID)
3. Close the browser: `browser_close`

## Rules

- **ZERO TOLERANCE**: No issue is too minor. If you see it, fix it.
- **Evidence-based**: Every finding must have a screenshot as evidence
- **Max 2 retries per phase**: If still failing after 2 retries, document remaining issues and escalate to user
- **Always clean up**: Kill dev server and close browser when done, even on failure
- **Screenshot naming**: `{phase}-{description}-{attempt}.png` (e.g. `phase1-homepage-1.png`)
