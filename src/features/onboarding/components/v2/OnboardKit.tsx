import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Caption,
  NumberDisplay,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useRecommendedItems } from '@/features/templates';
import { useNotification } from '@/shared/hooks';
import type { KitId, KitInfo, RecommendedItemsFile } from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';
import styles from './OnboardKit.module.css';

interface OnboardKitProps {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Step 5 — which set of recommendations to track against.
 *
 * The kit decides what "fully stocked" means for this household, so it is
 * chosen before the item list is drawn up. Built-in kits sit alongside any
 * JSON kit the household uploads.
 */
export function OnboardKit({ onNext, onBack }: Readonly<OnboardKitProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { showNotification } = useNotification();
  const { availableKits, selectedKitId, selectKit, uploadKit } =
    useRecommendedItems();
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Sequence number of the most recent file pick; see `handleFile`. */
  const latestUploadRef = useRef(0);
  // Blocks Continue while a file is being read/validated, so navigation
  // can't proceed with the kit selected before the upload lands.
  const [isUploading, setIsUploading] = useState(false);

  const reportUploadError = (error: string) =>
    showNotification(t('kits.uploadError', { error }), 'error', 6000);

  const handleFile = async (file: File) => {
    // Reading the file is async, so picking a second file before the first has
    // been read would otherwise let the earlier one land last — storing its kit
    // and selecting it over the household's actual choice.
    const request = ++latestUploadRef.current;
    const isStale = () => request !== latestUploadRef.current;
    setIsUploading(true);

    try {
      let parsed: RecommendedItemsFile;
      try {
        parsed = JSON.parse(await file.text()) as RecommendedItemsFile;
      } catch {
        if (isStale()) return;
        // A file that isn't JSON at all never reaches the upload validator, so
        // it has to be reported from this side.
        reportUploadError(t('kits.invalidJson'));
        return;
      }
      if (isStale()) return;
      const result = uploadKit(parsed);
      if (result.kitId) {
        selectKit(result.kitId);
        showNotification(
          t('kits.uploadSuccess', { name: file.name }),
          'success',
        );
        return;
      }
      reportUploadError(result.errors?.[0]?.message ?? t('kits.invalidJson'));
    } finally {
      if (!isStale()) setIsUploading(false);
    }
  };

  const kitCard = (kit: KitInfo) => {
    const selected = kit.id === selectedKitId;
    return (
      <button
        key={String(kit.id)}
        type="button"
        aria-pressed={selected}
        data-testid={`v2-kit-${String(kit.id)}`}
        onClick={() => selectKit(kit.id as KitId)}
        className={`${styles.kitCard} ${selected ? styles.kitCardSelected : ''}`}
      >
        <div className={styles.kitCardHeader}>
          <span className={styles.kitName}>{kit.name}</span>
          <span
            className={`${styles.kitBadge} ${selected ? styles.kitBadgeSelected : ''}`}
          >
            {t(
              kit.isBuiltIn
                ? `v2.onboarding.kit.builtIn.${themeKey}`
                : `v2.onboarding.kit.uploaded.${themeKey}`,
            )}
          </span>
        </div>
        {kit.description && (
          <div className={styles.kitDescription}>{kit.description}</div>
        )}
        <div className={styles.kitFooter}>
          <span className={styles.kitCount}>
            <NumberDisplay value={kit.itemCount} size={24} />
            <span className={styles.kitCountLabel}>
              {t(`v2.onboarding.kit.items.${themeKey}`)}
            </span>
          </span>
          <span
            aria-hidden
            className={`${styles.kitCheck} ${selected ? styles.kitCheckSelected : ''}`}
          >
            {selected ? '✓' : ''}
          </span>
        </div>
      </button>
    );
  };

  const builtIn = availableKits.filter((k) => k.isBuiltIn);
  const uploaded = availableKits.filter((k) => !k.isBuiltIn);

  return (
    <OnboardLayout
      step={5}
      title={t(`v2.voice.onbKit.${themeKey}`)}
      lead={{
        title: t(`v2.onboarding.kit.leadTitle.${themeKey}`),
        sub: t(`v2.onboarding.kit.leadSub.${themeKey}`),
      }}
      back={onBack}
      onContinue={onNext}
      continueDisabled={isUploading}
    >
      <Caption>{t(`v2.onboarding.kit.builtInCaption.${themeKey}`)}</Caption>
      <div className={styles.kitGrid}>{builtIn.map(kitCard)}</div>

      <Caption style={{ marginTop: 26 }}>
        {t(`v2.onboarding.kit.yourKitsCaption.${themeKey}`)}
      </Caption>
      {uploaded.length > 0 && (
        <div className={styles.kitGrid}>{uploaded.map(kitCard)}</div>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        data-testid="v2-kit-upload"
        className={styles.uploadButton}
      >
        <span className={styles.uploadIcon}>+</span>
        <span className={styles.uploadTitle}>
          {t(`v2.onboarding.kit.uploadTitle.${themeKey}`)}
        </span>
        <span className={styles.uploadHint}>
          {t(`v2.onboarding.kit.uploadHint.${themeKey}`)}
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="v2-kit-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so re-picking the same file fires change again.
          e.target.value = '';
          if (file) void handleFile(file);
        }}
      />
    </OnboardLayout>
  );
}
