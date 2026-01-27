import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { KitInfo, KitId, RecommendedItemsFile } from '@/shared/types';
import { isCustomKitId } from '@/shared/types';
import { KitCard } from '../KitCard';
import { parseRecommendedItemsFile } from '@/shared/utils/validation/recommendedItemsValidation';
import styles from './KitSelector.module.css';

export interface KitSelectorProps {
  readonly availableKits: KitInfo[];
  readonly selectedKitId: KitId | undefined;
  readonly onSelectKit: (kitId: KitId) => void;
  readonly onUploadKit?: (file: RecommendedItemsFile) => void;
  readonly onDeleteKit?: (kitId: `custom:${string}`) => void;
  readonly showUpload?: boolean;
  readonly showDelete?: boolean;
}

export function KitSelector({
  availableKits,
  selectedKitId,
  onSelectKit,
  onUploadKit,
  onDeleteKit,
  showUpload = true,
  showDelete = false,
}: KitSelectorProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const builtInKits = availableKits.filter((kit) => kit.isBuiltIn);
  const customKits = availableKits.filter((kit) => !kit.isBuiltIn);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadKit) return;

    try {
      const text = await file.text();
      // parseRecommendedItemsFile throws on invalid JSON/structure
      const kitFile = parseRecommendedItemsFile(text);
      onUploadKit(kitFile);
    } catch (error) {
      console.error('Failed to read or parse kit file:', error);
      alert(t('kits.uploadError'));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSelectKit = (kit: KitInfo) => {
    onSelectKit(kit.id);
  };

  const handleDeleteKit = (kit: KitInfo) => {
    if (isCustomKitId(kit.id) && onDeleteKit) {
      onDeleteKit(kit.id);
    }
  };

  return (
    <div className={styles.container} data-testid="kit-selector">
      {/* Built-in Kits */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('kits.builtInKits')}</h3>
        <div className={styles.kitsGrid}>
          {builtInKits.map((kit) => (
            <KitCard
              key={kit.id}
              kit={kit}
              isSelected={selectedKitId === kit.id}
              onSelect={handleSelectKit}
            />
          ))}
        </div>
      </section>

      {/* Custom Kits */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('kits.yourKits')}</h3>
        <div className={styles.kitsGrid}>
          {customKits.map((kit) => (
            <KitCard
              key={kit.id}
              kit={kit}
              isSelected={selectedKitId === kit.id}
              onSelect={handleSelectKit}
              onDelete={showDelete ? handleDeleteKit : undefined}
              showActions={showDelete}
            />
          ))}

          {showUpload && onUploadKit && (
            <button
              type="button"
              className={styles.uploadButton}
              onClick={handleUploadClick}
              data-testid="upload-kit-button"
            >
              <span className={styles.uploadIcon}>+</span>
              <span className={styles.uploadText}>{t('kits.uploadKit')}</span>
              <span className={styles.uploadHint}>
                {t('kits.uploadKitHint')}
              </span>
            </button>
          )}

          {customKits.length === 0 && !showUpload && (
            <p className={styles.emptyText}>{t('kits.noCustomKits')}</p>
          )}
        </div>
      </section>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className={styles.hiddenInput}
        data-testid="kit-file-input"
      />
    </div>
  );
}
