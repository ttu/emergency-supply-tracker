import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceProvider, useWorkspace } from '@/features/workspace';
import {
  clearAppData,
  getAppData,
  getWorkspaceList,
  getActiveWorkspaceId,
  createWorkspace as createWorkspaceStorage,
  DEFAULT_WORKSPACE_ID,
} from '@/shared/utils/storage/localStorage';

function TestConsumer() {
  const {
    activeWorkspaceId,
    workspaces,
    setActiveWorkspace,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,
  } = useWorkspace();
  return (
    <div>
      <span data-testid="active">{activeWorkspaceId}</span>
      <span data-testid="count">{workspaces.length}</span>
      <button
        type="button"
        onClick={() => workspaces[1] && setActiveWorkspace(workspaces[1].id)}
      >
        Set second
      </button>
      <button
        type="button"
        onClick={() =>
          setActiveWorkspace('nonexistent-id' as typeof activeWorkspaceId)
        }
      >
        Set invalid
      </button>
      <button type="button" onClick={() => createWorkspace('New')}>
        Create
      </button>
      <button
        type="button"
        onClick={() => workspaces[1] && deleteWorkspace(workspaces[1].id)}
      >
        Delete second
      </button>
      <button
        type="button"
        onClick={() =>
          workspaces[0] && renameWorkspace(workspaces[0].id, 'Renamed')
        }
      >
        Rename first
      </button>
    </div>
  );
}

describe('WorkspaceProvider', () => {
  beforeEach(() => {
    clearAppData();
  });

  it('reads initial state from storage', () => {
    getAppData();
    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>,
    );
    expect(screen.getByTestId('active')).toHaveTextContent(
      DEFAULT_WORKSPACE_ID,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('bootstraps default root when storage is empty', () => {
    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(getWorkspaceList()).toHaveLength(1);
  });

  it('setActiveWorkspace updates state when id exists', async () => {
    getAppData();
    const id = createWorkspaceStorage('Second');
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>,
    );
    expect(screen.getByTestId('active')).toHaveTextContent(
      DEFAULT_WORKSPACE_ID,
    );
    await user.click(screen.getByRole('button', { name: 'Set second' }));
    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent(id);
    });
    expect(getActiveWorkspaceId()).toBe(id);
  });

  it('setActiveWorkspace does not update when id does not exist', async () => {
    getAppData();
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>,
    );
    const initialActive = screen.getByTestId('active').textContent;
    await user.click(screen.getByRole('button', { name: 'Set invalid' }));
    expect(screen.getByTestId('active')).toHaveTextContent(initialActive ?? '');
    expect(getActiveWorkspaceId()).toBe(initialActive);
  });

  it('createWorkspace adds workspace and updates state', async () => {
    getAppData();
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
    expect(getWorkspaceList()).toHaveLength(2);
    expect(getWorkspaceList().some((w) => w.name === 'New')).toBe(true);
  });

  it('deleteWorkspace removes workspace and updates state', async () => {
    getAppData();
    createWorkspaceStorage('To remove');
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    await user.click(screen.getByRole('button', { name: 'Delete second' }));
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });
    expect(getWorkspaceList()).toHaveLength(1);
  });

  it('renameWorkspace updates name in state', async () => {
    getAppData();
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Rename first' }));
    await waitFor(() => {
      expect(getWorkspaceList()[0].name).toBe('Renamed');
    });
  });
});
