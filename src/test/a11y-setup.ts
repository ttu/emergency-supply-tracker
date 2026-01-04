/**
 * Accessibility testing setup for Jest
 *
 * This file configures jest-axe for component-level accessibility testing.
 * Import this in your test files to use the `toHaveNoViolations` matcher.
 *
 * @example
 * ```typescript
 * import { toHaveNoViolations } from 'jest-axe';
 * import { render } from '@testing-library/react';
 * import { axe } from 'jest-axe';
 *
 * expect.extend(toHaveNoViolations);
 *
 * test('component has no a11y violations', async () => {
 *   const { container } = render(<MyComponent />);
 *   const results = await axe(container);
 *   expect(results).toHaveNoViolations();
 * });
 * ```
 */

import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers with a11y assertions
expect.extend(toHaveNoViolations);
