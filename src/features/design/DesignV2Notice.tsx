import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings';
import { isDesignV2Theme } from '@/shared/types';

/**
 * Renders a one-time announcement banner letting existing v1 users know
 * about the new design v2 themes. Hidden once the user clicks "Try it"
 * (which switches to cockpit) or "Maybe later" (which dismisses).
 *
 * Render this inside the classic v1 app shell. It self-hides when the
 * active theme is already a design v2 theme.
 */
export function DesignV2Notice() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  if (settings.designV2NoticeDismissed) return null;
  if (isDesignV2Theme(settings.theme)) return null;

  const tryV2 = () => {
    updateSettings({ theme: 'cockpit', designV2NoticeDismissed: true });
  };
  const dismiss = () => {
    updateSettings({ designV2NoticeDismissed: true });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        margin: '12px 16px 0',
        padding: '14px 16px',
        background: 'var(--color-primary-alpha)',
        border: '1px solid var(--color-primary)',
        borderRadius: 'var(--radius-md, 8px)',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <div
          style={{
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: 4,
          }}
        >
          {t('settings.designV2Notice.title')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {t('settings.designV2Notice.body')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={tryV2}
          style={{
            padding: '8px 14px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm, 6px)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {t('settings.designV2Notice.tryAction')}
        </button>
        <button
          type="button"
          onClick={dismiss}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {t('settings.designV2Notice.dismissAction')}
        </button>
      </div>
    </div>
  );
}
