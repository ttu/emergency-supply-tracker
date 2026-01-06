/**
 * Accessibility testing setup for Vitest
 *
 * This file configures jest-axe for component-level accessibility testing.
 * This setup file runs automatically via vite.config.ts setupFiles.
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
import { expect } from 'vitest';

// Extend Vitest matchers with a11y assertions
expect.extend(toHaveNoViolations);
