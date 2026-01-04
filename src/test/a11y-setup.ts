/**
 * Accessibility testing setup for Jest
 *
 * This file configures jest-axe for component-level accessibility testing.
 * This setup file runs automatically via jest.config.js setupFilesAfterEnv.
 * Tests can use the `toHaveNoViolations` matcher without any additional setup.
 *
 * @example
 * ```typescript
 * import { axe } from 'jest-axe';
 * import { render } from '@testing-library/react';
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
