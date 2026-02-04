import { ReactNode, useState, useCallback } from 'react';
import type { WorkspaceId } from '@/shared/types';
import {
  getWorkspaceList,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  createWorkspace as createWorkspaceStorage,
  deleteWorkspace as deleteWorkspaceStorage,
  renameWorkspace as renameWorkspaceStorage,
  DEFAULT_WORKSPACE_ID,
} from '@/shared/utils/storage/localStorage';
import { getAppData } from '@/shared/utils/storage/localStorage';
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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [{ activeWorkspaceId, workspaces }, setState] =
    useState(readWorkspaceState);

  const setActiveWorkspace = useCallback((id: WorkspaceId) => {
    setActiveWorkspaceId(id);
    setState((prev) => ({
      ...prev,
      activeWorkspaceId: id,
      workspaces: getWorkspaceList(),
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

  const value = {
    activeWorkspaceId,
    workspaces,
    setActiveWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      <div key={activeWorkspaceId}>{children}</div>
    </WorkspaceContext.Provider>
  );
}
