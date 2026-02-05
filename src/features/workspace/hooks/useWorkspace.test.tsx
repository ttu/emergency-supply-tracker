import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useWorkspace } from './useWorkspace';

function Consumer() {
  useWorkspace();
  return null;
}

describe('useWorkspace', () => {
  it('throws when used outside WorkspaceProvider', () => {
    expect(() => render(<Consumer />)).toThrow(
      'useWorkspace must be used within a WorkspaceProvider',
    );
  });
});
