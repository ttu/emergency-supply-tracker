import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useInventorySet } from './useInventorySet';

function Consumer() {
  useInventorySet();
  return null;
}

describe('useInventorySet', () => {
  it('throws when used outside InventorySetProvider', () => {
    expect(() => render(<Consumer />)).toThrow(
      'useInventorySet must be used within an InventorySetProvider',
    );
  });
});
