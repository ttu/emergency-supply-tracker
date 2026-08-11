import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..');

const read = (relative: string) => readFileSync(join(src, relative), 'utf8');

/**
 * iOS Safari resolves `100vh` to the viewport measured with its browser chrome
 * collapsed — taller than what is actually on screen. A container pinned to
 * `100vh` runs behind the bottom toolbar and swallows its last row: the
 * onboarding CONTINUE button, the mobile shell's nav. It surfaces while you
 * drag (chrome collapses) and disappears again on release.
 *
 * The fix is the `.v2-viewport-height` class, which declares `100vh` then
 * `100dvh` so old browsers keep the former and everything else takes the
 * latter. These tests exist because the trap is easy to walk back into: an
 * inline `height: '100vh'` looks perfectly reasonable in review.
 */
describe('design v2 full-viewport containers', () => {
  it('define the height as a 100vh → 100dvh fallback pair', () => {
    const css = read('styles/design-themes.css');
    const rule = /\.v2-viewport-height\s*\{([^}]*)\}/.exec(css);
    expect(rule).not.toBeNull();
    expect(rule![1]).toMatch(/height:\s*100vh/);
    expect(rule![1]).toMatch(/height:\s*100dvh/);
    // Order matters: the dvh declaration has to win where it is understood.
    expect(rule![1].indexOf('100vh')).toBeLessThan(rule![1].indexOf('100dvh'));
  });

  it('locks the document to the dynamic viewport too', () => {
    const css = read('styles/design-themes.css');
    expect(css).toMatch(
      /:root[^{}]*\[data-theme='cockpit'\][^{}]*\{[^}]*height:\s*100dvh/,
    );
    expect(css).toMatch(
      /overflow:\s*hidden;\s*height:\s*100vh;\s*height:\s*100dvh/,
    );
  });

  it.each([
    ['shared/components/design-v2/Shell.tsx', 2],
    ['features/onboarding/components/v2/OnboardLayout.tsx', 1],
    ['features/onboarding/components/v2/OnboardComplete.tsx', 1],
  ])('%s uses the class rather than an inline 100vh', (file, expected) => {
    const source = read(file);
    expect(source).not.toMatch(/height\s*:\s*['"]100vh['"]/);
    // Count the applications, not the prose — these files explain the trap in
    // comments that also name the class.
    expect(source.match(/className="v2-viewport-height"/g) ?? []).toHaveLength(
      expected,
    );
  });
});
