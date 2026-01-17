import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import type { AppData } from '@/shared/types';
import type { ExportSection } from '@/shared/types/exportImport';
import {
  ALL_EXPORT_SECTIONS,
  getSectionInfo,
  type SectionInfo,
} from '@/shared/types/exportImport';
import styles from './ExportSelectionModal.module.css';

export interface ExportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (sections: ExportSection[]) => void;
  appData: AppData;
}

export function ExportSelectionModal({
  isOpen,
  onClose,
  onExport,
  appData,
}: ExportSelectionModalProps) {
  const { t } = useTranslation();

  // Initialize with all sections selected
  const [selectedSections, setSelectedSections] = useState<Set<ExportSection>>(
    () => new Set(ALL_EXPORT_SECTIONS),
  );

  // Get section info with counts
  const sectionInfoList = useMemo(() => getSectionInfo(appData), [appData]);

  const handleToggleSection = useCallback((section: ExportSection) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedSections(new Set(ALL_EXPORT_SECTIONS));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedSections(new Set());
  }, []);

  const handleExport = useCallback(() => {
    onExport(Array.from(selectedSections));
    onClose();
  }, [selectedSections, onExport, onClose]);

  const getSectionLabel = (section: ExportSection): string => {
    return t(`settings.exportSelection.sections.${section}`);
  };

  const formatCount = (info: SectionInfo): string => {
    if (!info.hasData) {
      return '(0)';
    }
    if (info.section === 'household' || info.section === 'settings') {
      return '';
    }
    return `(${info.count})`;
  };

  const allSelected = selectedSections.size === ALL_EXPORT_SECTIONS.length;
  const noneSelected = selectedSections.size === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.exportSelection.title')}
      size="small"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          {t('settings.exportSelection.description')}
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={handleSelectAll}
            disabled={allSelected}
          >
            {t('settings.exportSelection.selectAll')}
          </button>
          <span className={styles.separator}>|</span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={handleDeselectAll}
            disabled={noneSelected}
          >
            {t('settings.exportSelection.deselectAll')}
          </button>
        </div>

        <div className={styles.sectionList}>
          {sectionInfoList.map((info) => (
            <label
              key={info.section}
              className={`${styles.sectionItem} ${!info.hasData ? styles.disabled : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedSections.has(info.section)}
                onChange={() => handleToggleSection(info.section)}
                disabled={!info.hasData}
                className={styles.checkbox}
              />
              <span className={styles.sectionLabel}>
                {getSectionLabel(info.section)}
                {formatCount(info) && (
                  <span className={styles.count}>{formatCount(info)}</span>
                )}
              </span>
            </label>
          ))}
        </div>

        <div className={styles.buttonRow}>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={noneSelected}
          >
            {t('settings.exportSelection.exportButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
