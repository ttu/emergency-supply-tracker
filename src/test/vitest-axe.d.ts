import type { MatcherResult } from 'vitest';

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): MatcherResult;
  }
}
