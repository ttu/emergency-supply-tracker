import { createContext } from 'react';
import type { WorkspaceId } from '@/shared/types';
import type { WorkspaceListItem } from '@/shared/utils/storage/localStorage';

export interface WorkspaceContextValue {
  activeWorkspaceId: WorkspaceId;
  workspaces: WorkspaceListItem[];
  setActiveWorkspace: (id: WorkspaceId) => void;
  createWorkspace: (name: string) => WorkspaceId;
  deleteWorkspace: (id: WorkspaceId) => void;
  renameWorkspace: (id: WorkspaceId, name: string) => void;
}

export const WorkspaceContext = createContext<
  WorkspaceContextValue | undefined
>(undefined);
