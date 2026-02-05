import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  InventorySetProvider,
  useInventorySet,
} from '@/features/inventory-set';
import {
  clearAppData,
  getAppData,
  getInventorySetList,
  getActiveInventorySetId,
  createInventorySet as createInventorySetStorage,
  DEFAULT_INVENTORY_SET_ID,
} from '@/shared/utils/storage/localStorage';

function TestConsumer() {
  const {
    activeInventorySetId,
    inventorySets,
    setActiveInventorySet,
    createInventorySet,
    deleteInventorySet,
    renameInventorySet,
  } = useInventorySet();
  return (
    <div>
      <span data-testid="active">{activeInventorySetId}</span>
      <span data-testid="count">{inventorySets.length}</span>
      <button
        type="button"
        onClick={() =>
          inventorySets[1] && setActiveInventorySet(inventorySets[1].id)
        }
      >
        Set second
      </button>
      <button
        type="button"
        onClick={() =>
          setActiveInventorySet('nonexistent-id' as typeof activeInventorySetId)
        }
      >
        Set invalid
      </button>
      <button type="button" onClick={() => createInventorySet('New')}>
        Create
      </button>
      <button
        type="button"
        onClick={() =>
          inventorySets[1] && deleteInventorySet(inventorySets[1].id)
        }
      >
        Delete second
      </button>
      <button
        type="button"
        onClick={() =>
          inventorySets[0] && renameInventorySet(inventorySets[0].id, 'Renamed')
        }
      >
        Rename first
      </button>
    </div>
  );
}

describe('InventorySetProvider', () => {
  beforeEach(() => {
    clearAppData();
  });

  it('reads initial state from storage', () => {
    getAppData();
    render(
      <InventorySetProvider>
        <TestConsumer />
      </InventorySetProvider>,
    );
    expect(screen.getByTestId('active')).toHaveTextContent(
      DEFAULT_INVENTORY_SET_ID,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('bootstraps default root when storage is empty', () => {
    render(
      <InventorySetProvider>
        <TestConsumer />
      </InventorySetProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(getInventorySetList()).toHaveLength(1);
  });

  it('setActiveInventorySet updates state when id exists', async () => {
    getAppData();
    const id = createInventorySetStorage('Second');
    const user = userEvent.setup();
    render(
      <InventorySetProvider>
        <TestConsumer />
      </InventorySetProvider>,
    );
    expect(screen.getByTestId('active')).toHaveTextContent(
      DEFAULT_INVENTORY_SET_ID,
    );
    await user.click(screen.getByRole('button', { name: 'Set second' }));
    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent(id);
    });
    expect(getActiveInventorySetId()).toBe(id);
  });

  it('setActiveInventorySet does not update when id does not exist', async () => {
    getAppData();
    const user = userEvent.setup();
    render(
      <InventorySetProvider>
        <TestConsumer />
      </InventorySetProvider>,
    );
    const initialActive = screen.getByTestId('active').textContent;
    await user.click(screen.getByRole('button', { name: 'Set invalid' }));
    expect(screen.getByTestId('active')).toHaveTextContent(initialActive ?? '');
    expect(getActiveInventorySetId()).toBe(initialActive);
  });

  it('createInventorySet adds inventory set and updates state', async () => {
    getAppData();
    const user = userEvent.setup();
    render(
      <InventorySetProvider>
        <TestConsumer />
      </InventorySetProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
    expect(getInventorySetList()).toHaveLength(2);
    expect(getInventorySetList().some((w) => w.name === 'New')).toBe(true);
  });

  it('deleteInventorySet removes inventory set and updates state', async () => {
    getAppData();
    createInventorySetStorage('To remove');
    const user = userEvent.setup();
    render(
      <InventorySetProvider>
        <TestConsumer />
      </InventorySetProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    await user.click(screen.getByRole('button', { name: 'Delete second' }));
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });
    expect(getInventorySetList()).toHaveLength(1);
  });

  it('renameInventorySet updates name in state', async () => {
    getAppData();
    const user = userEvent.setup();
    render(
      <InventorySetProvider>
        <TestConsumer />
      </InventorySetProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Rename first' }));
    await waitFor(() => {
      expect(getInventorySetList()[0].name).toBe('Renamed');
    });
  });
});
