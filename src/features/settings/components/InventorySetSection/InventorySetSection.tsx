import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventorySet } from '@/features/inventory-set';
import type { InventorySetId } from '@/shared/types';
import { Button } from '@/shared/components/Button';
import { LEGACY_IMPORT_SET_NAME } from '@/shared/types/exportImport';
import styles from './InventorySetSection.module.css';

export function InventorySetSection() {
  const { t } = useTranslation();
  const {
    activeInventorySetId,
    inventorySets,
    setActiveInventorySet,
    createInventorySet,
    deleteInventorySet,
    renameInventorySet,
  } = useInventorySet();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<InventorySetId | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<InventorySetId | null>(
    null,
  );
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const canDelete = inventorySets.length > 1;

  // Helper to translate legacy import set name
  const getDisplayName = useCallback(
    (name: string) =>
      name === LEGACY_IMPORT_SET_NAME
        ? t('settings.import.legacySetName')
        : name,
    [t],
  );

  // Inventory sets with translated display names
  const inventorySetsWithDisplayNames = useMemo(
    () =>
      inventorySets.map((set) => ({
        ...set,
        displayName: getDisplayName(set.name),
      })),
    [inventorySets, getDisplayName],
  );

  const handleCreate = useCallback(() => {
    const name = newName.trim() || t('settings.inventorySets.defaultName');
    if (name) {
      createInventorySet(name);
      setNewName('');
    }
  }, [createInventorySet, newName, t]);

  const handleStartRename = useCallback(
    (id: InventorySetId) => {
      const w = inventorySets.find((x) => x.id === id);
      if (w) {
        setEditingId(id);
        setEditName(w.name);
      }
    },
    [inventorySets],
  );

  const handleSaveRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameInventorySet(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  }, [editingId, editName, renameInventorySet]);

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const handleDeleteClick = useCallback(
    (id: InventorySetId, trigger: HTMLElement) => {
      triggerRef.current = trigger;
      setConfirmDeleteId(id);
    },
    [],
  );

  const closeDialog = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    setConfirmDeleteId(null);
    // Use requestAnimationFrame to restore focus after React re-renders
    // and the dialog is fully unmounted
    requestAnimationFrame(() => {
      trigger?.focus();
    });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      deleteInventorySet(confirmDeleteId);
    }
    closeDialog();
  }, [confirmDeleteId, deleteInventorySet, closeDialog]);

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
          '[data-testid="inventory-set-confirm-delete-button"]',
        )
        ?.focus();
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault(); // Prevent native dialog close handling
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
    <div className={styles.container} data-testid="inventory-set-section">
      <p className={styles.description}>
        {t('settings.inventorySets.description')}
      </p>

      <div className={styles.activeRow}>
        <label htmlFor="inventory-set-select" className={styles.label}>
          {t('settings.inventorySets.activeInventorySet')}
        </label>
        <select
          id="inventory-set-select"
          value={activeInventorySetId}
          onChange={(e) =>
            setActiveInventorySet(e.target.value as InventorySetId)
          }
          className={styles.select}
          aria-label={t('settings.inventorySets.activeInventorySet')}
        >
          {inventorySetsWithDisplayNames.map((w) => (
            <option key={w.id} value={w.id}>
              {w.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.listSection}>
        <h3 className={styles.listTitle}>
          {t('settings.inventorySets.inventorySetList')}
        </h3>
        <ul
          className={styles.list}
          aria-label={t('settings.inventorySets.inventorySetList')}
        >
          {inventorySetsWithDisplayNames.map((w) => (
            <li key={w.id} className={styles.listItem}>
              {editingId === w.id ? (
                <div className={styles.editRow}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.input}
                    aria-label={t('settings.inventorySets.renameLabel')}
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
                  <span className={styles.inventorySetName}>
                    {w.displayName}
                    {w.id === activeInventorySetId && (
                      <span className={styles.activeBadge}>
                        {t('settings.inventorySets.active')}
                      </span>
                    )}
                  </span>
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleStartRename(w.id)}
                      aria-label={t('settings.inventorySets.renameLabel')}
                    >
                      {t('settings.inventorySets.rename')}
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
                        aria-label={t('settings.inventorySets.deleteLabel')}
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
        <label htmlFor="new-inventory-set-name" className={styles.label}>
          {t('settings.inventorySets.createInventorySet')}
        </label>
        <div className={styles.createInputRow}>
          <input
            id="new-inventory-set-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('settings.inventorySets.newNamePlaceholder')}
            className={styles.input}
            aria-label={t('settings.inventorySets.newNamePlaceholder')}
          />
          <Button variant="primary" onClick={handleCreate}>
            {t('settings.inventorySets.addInventorySet')}
          </Button>
        </div>
      </div>

      {confirmDeleteId && (
        <dialog
          ref={confirmDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-inventory-set-title"
          className={styles.confirmOverlay}
          data-testid="inventory-set-confirm-delete-dialog"
          onClose={handleCancelDelete}
        >
          <div className={styles.confirmDialog}>
            <h3 id="delete-inventory-set-title">
              {t('settings.inventorySets.confirmDeleteTitle')}
            </h3>
            <p>{t('settings.inventorySets.confirmDeleteMessage')}</p>
            <div className={styles.confirmActions}>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                data-testid="inventory-set-confirm-delete-button"
              >
                {t('common.delete')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelDelete}
                data-testid="inventory-set-confirm-cancel-button"
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
