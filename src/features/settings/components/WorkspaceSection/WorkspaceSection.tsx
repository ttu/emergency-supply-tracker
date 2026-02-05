import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/features/workspace';
import type { WorkspaceId } from '@/shared/types';
import { Button } from '@/shared/components/Button';
import styles from './WorkspaceSection.module.css';

export function WorkspaceSection() {
  const { t } = useTranslation();
  const {
    activeWorkspaceId,
    workspaces,
    setActiveWorkspace,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,
  } = useWorkspace();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<WorkspaceId | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<WorkspaceId | null>(
    null,
  );
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const canDelete = workspaces.length > 1;

  const handleCreate = useCallback(() => {
    const name = newName.trim() || t('settings.workspaces.defaultName');
    if (name) {
      createWorkspace(name);
      setNewName('');
    }
  }, [createWorkspace, newName, t]);

  const handleStartRename = useCallback(
    (id: WorkspaceId) => {
      const w = workspaces.find((x) => x.id === id);
      if (w) {
        setEditingId(id);
        setEditName(w.name);
      }
    },
    [workspaces],
  );

  const handleSaveRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameWorkspace(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  }, [editingId, editName, renameWorkspace]);

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const handleDeleteClick = useCallback(
    (id: WorkspaceId, trigger: HTMLElement) => {
      triggerRef.current = trigger;
      setConfirmDeleteId(id);
    },
    [],
  );

  const closeDialog = useCallback(() => {
    triggerRef.current?.focus();
    triggerRef.current = null;
    setConfirmDeleteId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      deleteWorkspace(confirmDeleteId);
    }
    closeDialog();
  }, [confirmDeleteId, deleteWorkspace, closeDialog]);

  const handleCancelDelete = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  // When dialog is open: show modal, focus primary action, Escape, and focus trap
  useEffect(() => {
    if (!confirmDeleteId) return;
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
    const rafId = requestAnimationFrame(() => {
      dialog
        .querySelector<HTMLElement>(
          '[data-testid="workspace-confirm-delete-button"]',
        )
        ?.focus();
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelDelete();
        return;
      }
      if (e.key === 'Tab' && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (focusable.length === 0) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [confirmDeleteId, handleCancelDelete]);

  return (
    <div className={styles.container} data-testid="workspace-section">
      <p className={styles.description}>
        {t('settings.workspaces.description')}
      </p>

      <div className={styles.activeRow}>
        <label htmlFor="workspace-select" className={styles.label}>
          {t('settings.workspaces.activeWorkspace')}
        </label>
        <select
          id="workspace-select"
          value={activeWorkspaceId}
          onChange={(e) => setActiveWorkspace(e.target.value as WorkspaceId)}
          className={styles.select}
          aria-label={t('settings.workspaces.activeWorkspace')}
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.listSection}>
        <h3 className={styles.listTitle}>
          {t('settings.workspaces.workspaceList')}
        </h3>
        <ul
          className={styles.list}
          aria-label={t('settings.workspaces.workspaceList')}
        >
          {workspaces.map((w) => (
            <li key={w.id} className={styles.listItem}>
              {editingId === w.id ? (
                <div className={styles.editRow}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.input}
                    aria-label={t('settings.workspaces.renameLabel')}
                  />
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleSaveRename}
                  >
                    {t('common.save')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleCancelRename}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              ) : (
                <>
                  <span className={styles.workspaceName}>
                    {w.name}
                    {w.id === activeWorkspaceId && (
                      <span className={styles.activeBadge}>
                        {t('settings.workspaces.active')}
                      </span>
                    )}
                  </span>
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleStartRename(w.id)}
                      aria-label={t('settings.workspaces.renameLabel')}
                    >
                      {t('settings.workspaces.rename')}
                    </Button>
                    {canDelete && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={(e) =>
                          handleDeleteClick(
                            w.id,
                            e.currentTarget as HTMLElement,
                          )
                        }
                        aria-label={t('settings.workspaces.deleteLabel')}
                      >
                        {t('common.delete')}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.createRow}>
        <label htmlFor="new-workspace-name" className={styles.label}>
          {t('settings.workspaces.createWorkspace')}
        </label>
        <div className={styles.createInputRow}>
          <input
            id="new-workspace-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('settings.workspaces.newNamePlaceholder')}
            className={styles.input}
            aria-label={t('settings.workspaces.newNamePlaceholder')}
          />
          <Button variant="primary" onClick={handleCreate}>
            {t('settings.workspaces.addWorkspace')}
          </Button>
        </div>
      </div>

      {confirmDeleteId && (
        <dialog
          ref={confirmDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-workspace-title"
          className={styles.confirmOverlay}
          data-testid="workspace-confirm-delete-dialog"
          onClose={handleCancelDelete}
        >
          <div className={styles.confirmDialog}>
            <h3 id="delete-workspace-title">
              {t('settings.workspaces.confirmDeleteTitle')}
            </h3>
            <p>{t('settings.workspaces.confirmDeleteMessage')}</p>
            <div className={styles.confirmActions}>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                data-testid="workspace-confirm-delete-button"
              >
                {t('common.delete')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelDelete}
                data-testid="workspace-confirm-cancel-button"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
