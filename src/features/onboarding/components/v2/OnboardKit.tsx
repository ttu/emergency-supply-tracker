import { useRef } from 'react';
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

  const reportUploadError = (error: string) =>
    showNotification(t('kits.uploadError', { error }), 'error', 6000);

  const handleFile = async (file: File) => {
    let parsed: RecommendedItemsFile;
    try {
      parsed = JSON.parse(await file.text()) as RecommendedItemsFile;
    } catch {
      // A file that isn't JSON at all never reaches the upload validator, so
      // it has to be reported from this side.
      reportUploadError(t('kits.invalidJson'));
      return;
    }
    const result = uploadKit(parsed);
    if (result.kitId) {
      selectKit(result.kitId);
      showNotification(t('kits.uploadSuccess', { name: file.name }), 'success');
      return;
    }
    reportUploadError(result.errors?.[0]?.message ?? t('kits.invalidJson'));
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
        style={{
          padding: 20,
          border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
          background: selected ? 'var(--color-panel)' : 'transparent',
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
          outline: selected ? '1px solid var(--color-accent)' : 'none',
          outlineOffset: -3,
          textAlign: 'left',
          fontFamily: 'inherit',
          color: 'inherit',
          display: 'block',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: 'var(--color-text)',
              maxWidth: '76%',
            }}
          >
            {kit.name}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              padding: '4px 8px',
              borderRadius: 'var(--radius-pill)',
              background: selected
                ? 'var(--color-accent)'
                : 'var(--color-panel-2)',
              color: selected
                ? 'var(--color-accent-ink)'
                : 'var(--color-text-3)',
              border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
              whiteSpace: 'nowrap',
            }}
          >
            {t(
              kit.isBuiltIn
                ? `v2.onboarding.kit.builtIn.${themeKey}`
                : `v2.onboarding.kit.uploaded.${themeKey}`,
            )}
          </span>
        </div>
        {kit.description && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: 'var(--color-text-2)',
              lineHeight: 1.55,
              minHeight: 40,
            }}
          >
            {kit.description}
          </div>
        )}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid var(--color-rule-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <NumberDisplay value={kit.itemCount} size={24} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-3)',
                letterSpacing: '0.06em',
              }}
            >
              {t(`v2.onboarding.kit.items.${themeKey}`)}
            </span>
          </span>
          <span
            aria-hidden
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
              background: selected ? 'var(--color-accent)' : 'transparent',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-accent-ink)',
              fontSize: 12,
              fontWeight: 700,
            }}
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
    >
      <Caption>{t(`v2.onboarding.kit.builtInCaption.${themeKey}`)}</Caption>
      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {builtIn.map(kitCard)}
      </div>

      <Caption style={{ marginTop: 26 }}>
        {t(`v2.onboarding.kit.yourKitsCaption.${themeKey}`)}
      </Caption>
      {uploaded.length > 0 && (
        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {uploaded.map(kitCard)}
        </div>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        data-testid="v2-kit-upload"
        style={{
          marginTop: 12,
          width: '100%',
          padding: '28px 20px',
          textAlign: 'center',
          border: '1.5px dashed var(--color-rule)',
          borderRadius: 'var(--radius-lg)',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'inherit',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            color: 'var(--color-accent)',
            lineHeight: 1,
          }}
        >
          +
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 10,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          {t(`v2.onboarding.kit.uploadTitle.${themeKey}`)}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-3)',
            letterSpacing: '0.04em',
          }}
        >
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
