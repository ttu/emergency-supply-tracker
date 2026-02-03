import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedKitMetaString } from '@/shared/utils/kitMeta';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Toast } from '@/shared/components/Toast';
import { useRecommendedItems } from '@/features/templates';
import { KitSelector } from '@/features/templates/components/KitSelector';
import { KitEditor } from '@/features/templates/components/KitEditor';
import type { KitId, RecommendedItemsFile } from '@/shared/types';
import styles from './KitManagement.module.css';

/**
 * Sanitizes a string to be used as a filename.
 * Replaces reserved characters and control characters with hyphens,
 * trims whitespace, collapses runs of replacement characters,
 * and falls back to the provided fallback string if the result is empty.
 *
 * @param name - The name to sanitize
 * @param fallback - The fallback string to use if sanitized name is empty (default: 'recommendations')
 * @returns A sanitized filename-safe string
 */
function sanitizeFileName(name: string, fallback = 'recommendations'): string {
  // Replace reserved characters: / \ : * ? " < > |
  // Also replace control characters (char codes < 32)
  // eslint-disable-next-line no-control-regex
  const controlCharRegex = /[\x00-\x1F]/g; // Control chars 0-31
  let sanitized = name
    .replaceAll(/[/\\:*?"<>|]/g, '-')
    .replaceAll(controlCharRegex, '-')
    .trim();

  // Collapse runs of hyphens/underscores into a single hyphen
  sanitized = sanitized.replaceAll(/[-_]+/g, '-');

  // Remove leading/trailing hyphens after collapsing
  // Group parts of the regex together to make the intended operator precedence explicit
  sanitized = sanitized.replaceAll(/(^-+|-+$)/g, '');

  // Fall back to provided fallback if empty
  return sanitized || fallback;
}

export function KitManagement() {
  const { t, i18n } = useTranslation();
  const {
    availableKits,
    selectedKitId,
    selectKit,
    uploadKit,
    deleteKit,
    exportRecommendedItems,
  } = useRecommendedItems();

  const [kitToDelete, setKitToDelete] = useState<`custom:${string}` | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>(
    'success',
  );
  const [isKitEditorOpen, setIsKitEditorOpen] = useState(false);

  const selectedKit = availableKits.find((kit) => kit.id === selectedKitId);

  const handleSelectKit = useCallback(
    (kitId: KitId) => {
      selectKit(kitId);
      const kit = availableKits.find((k) => k.id === kitId);
      if (kit) {
        setToastMessage(t('kits.selected', { name: kit.name }) as string);
        setToastVariant('success');
      }
    },
    [selectKit, availableKits, t],
  );

  const handleUploadKit = useCallback(
    (file: RecommendedItemsFile) => {
      const result = uploadKit(file);
      if (result.kitId) {
        // Auto-select the uploaded kit
        selectKit(result.kitId);
        setToastMessage(
          t('kits.uploadSuccess', {
            name: getLocalizedKitMetaString(file.meta.name, i18n.language),
          }) as string,
        );
        setToastVariant('success');
      } else if (result.errors && result.errors.length > 0) {
        setToastMessage(
          t('kits.uploadError', {
            error: result.errors[0],
          }) as string,
        );
        setToastVariant('error');
      }
    },
    [uploadKit, selectKit, t, i18n],
  );

  const handleDeleteKit = useCallback((kitId: `custom:${string}`) => {
    setKitToDelete(kitId);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (kitToDelete) {
      const kit = availableKits.find((k) => k.id === kitToDelete);
      deleteKit(kitToDelete);
      setKitToDelete(null);
      if (kit) {
        setToastMessage(t('kits.deleteSuccess', { name: kit.name }) as string);
        setToastVariant('success');
      }
    }
  }, [kitToDelete, deleteKit, availableKits, t]);

  const handleCancelDelete = useCallback(() => {
    setKitToDelete(null);
  }, []);

  const handleExport = useCallback(() => {
    const kitData = exportRecommendedItems();
    const json = JSON.stringify(kitData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Sanitize the kit name for use as a filename
    const sanitizedName = sanitizeFileName(
      selectedKit?.name || '',
      t('kits.defaultFileName'),
    );
    link.download = `${sanitizedName}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setToastMessage(t('kits.exportSuccess') as string);
    setToastVariant('success');
  }, [exportRecommendedItems, selectedKit, t]);

  const handleCloseToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const kitToDeleteInfo = kitToDelete
    ? availableKits.find((k) => k.id === kitToDelete)
    : null;

  return (
    <div className={styles.container} data-testid="kit-management">
      {/* Current Kit Status */}
      <div className={styles.statusSection}>
        <div className={styles.statusInfo}>
          <span className={styles.label}>{t('kits.currentKit.label')}</span>
          {selectedKit ? (
            <span className={styles.value}>
              {selectedKit.name}
              <span className={styles.itemCount}>
                ({t('kits.itemCount', { count: selectedKit.itemCount })})
              </span>
              {selectedKit.isBuiltIn && (
                <span className={styles.badge}>{t('kits.builtIn')}</span>
              )}
            </span>
          ) : (
            <span className={styles.value}>{t('kits.noKitSelected')}</span>
          )}
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => setIsKitEditorOpen(true)}
            disabled={!selectedKitId}
            data-testid="view-edit-items-button"
          >
            {t('kits.viewEditItems')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={!selectedKitId}
            data-testid="export-kit-button"
          >
            {t('kits.export')}
          </Button>
        </div>
      </div>

      {/* Kit Selector */}
      <div className={styles.selectorSection}>
        <h3 className={styles.sectionTitle}>{t('kits.selectKit')}</h3>
        <KitSelector
          availableKits={availableKits}
          selectedKitId={selectedKitId}
          onSelectKit={handleSelectKit}
          onUploadKit={handleUploadKit}
          onDeleteKit={handleDeleteKit}
          showUpload={true}
          showDelete={true}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!kitToDelete}
        title={t('kits.deleteConfirm.title')}
        message={t('kits.deleteConfirm.message', {
          name: kitToDeleteInfo?.name || '',
        })}
        confirmLabel={t('kits.deleteConfirm.confirm')}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Toast notifications */}
      <Toast
        isVisible={!!toastMessage}
        message={toastMessage || ''}
        variant={toastVariant}
        onClose={handleCloseToast}
      />

      {/* Kit Editor Modal */}
      <KitEditor
        isOpen={isKitEditorOpen}
        onClose={() => setIsKitEditorOpen(false)}
      />
    </div>
  );
}
