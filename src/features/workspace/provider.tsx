import { ReactNode, useState, useCallback, useMemo } from 'react';
import type { WorkspaceId } from '@/shared/types';
import {
  getWorkspaceList,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  createWorkspace as createWorkspaceStorage,
  deleteWorkspace as deleteWorkspaceStorage,
  renameWorkspace as renameWorkspaceStorage,
  getAppData,
  DEFAULT_WORKSPACE_ID,
} from '@/shared/utils/storage/localStorage';
import { WorkspaceContext } from './context';

function readWorkspaceState(): {
  workspaces: ReturnType<typeof getWorkspaceList>;
  activeWorkspaceId: WorkspaceId;
} {
  const list = getWorkspaceList();
  if (list.length === 0) {
    getAppData(); // creates default root and saves
    return {
      workspaces: getWorkspaceList(),
      activeWorkspaceId: getActiveWorkspaceId() ?? DEFAULT_WORKSPACE_ID,
    };
  }
  return {
    workspaces: list,
    activeWorkspaceId: getActiveWorkspaceId() ?? DEFAULT_WORKSPACE_ID,
  };
}

export function WorkspaceProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [{ activeWorkspaceId, workspaces }, setState] =
    useState(readWorkspaceState);

  const setActiveWorkspace = useCallback((id: WorkspaceId) => {
    const list = getWorkspaceList();
    const exists = list.some((w) => w.id === id);
    if (!exists) return;
    setActiveWorkspaceId(id);
    setState((prev) => ({
      ...prev,
      activeWorkspaceId: id,
      workspaces: list,
    }));
  }, []);

  const createWorkspace = useCallback((name: string) => {
    const id = createWorkspaceStorage(name);
    setState((prev) => ({ ...prev, workspaces: getWorkspaceList() }));
    return id;
  }, []);

  const deleteWorkspace = useCallback((id: WorkspaceId) => {
    deleteWorkspaceStorage(id);
    setState((prev) => ({
      ...prev,
      activeWorkspaceId: getActiveWorkspaceId() ?? DEFAULT_WORKSPACE_ID,
      workspaces: getWorkspaceList(),
    }));
  }, []);

  const renameWorkspace = useCallback((id: WorkspaceId, name: string) => {
    renameWorkspaceStorage(id, name);
    setState((prev) => ({ ...prev, workspaces: getWorkspaceList() }));
  }, []);

  const value = useMemo(
    () => ({
      activeWorkspaceId,
      workspaces,
      setActiveWorkspace,
      createWorkspace,
      renameWorkspace,
      deleteWorkspace,
    }),
    [
      activeWorkspaceId,
      workspaces,
      setActiveWorkspace,
      createWorkspace,
      renameWorkspace,
      deleteWorkspace,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      <div key={activeWorkspaceId}>{children}</div>
    </WorkspaceContext.Provider>
  );
}
