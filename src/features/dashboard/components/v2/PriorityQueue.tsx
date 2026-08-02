import { useTranslation } from 'react-i18next';
import {
  Caption,
  Panel,
  StatusDot,
  StatusPill,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';

interface PriorityQueueProps {
  onViewAll: () => void;
  /** How many priority rows to show. Defaults to 5. */
  limit?: number;
}

/** Top-N items needing action — non-OK status sorted critical-first. */
function critFirst(a: { status: string }, b: { status: string }): number {
  // Equal statuses must compare 0, or the comparator is inconsistent
  // (compare(a,b) and compare(b,a) both returning -1) and the sort order
  // among criticals becomes implementation-defined.
  if (a.status === b.status) return 0;
  if (a.status === 'crit') return -1;
  if (b.status === 'crit') return 1;
  return 0;
}

export function PriorityQueue({
  onViewAll,
  limit = 5,
}: Readonly<PriorityQueueProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { rows } = useDesignData();
  const priority = [...rows]
    .filter((r) => r.status !== 'ok')
    .sort(critFirst)
    .slice(0, limit);

  return (
    <Panel padding={0}>
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-rule-soft)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Caption>{t(`v2.dashboard.priorityTitle.${themeKey}`)}</Caption>
        <button
          type="button"
          onClick={onViewAll}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-accent)',
            letterSpacing: '0.08em',
            fontWeight: 700,
          }}
        >
          {t('v2.dashboard.priorityViewAll')}
        </button>
      </div>
      {priority.length === 0 && (
        <div
          style={{
            padding: 24,
            color: 'var(--color-text-2)',
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          {t(`v2.dashboard.priorityEmpty.${themeKey}`)}
        </div>
      )}
      {priority.map((r, i) => (
        <div
          key={String(r.item.id)}
          style={{
            padding: '14px 20px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 14,
            alignItems: 'center',
            borderBottom:
              i < priority.length - 1
                ? '1px solid var(--color-rule-soft)'
                : 'none',
          }}
        >
          <StatusDot status={r.status} size={7} />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text)',
              }}
            >
              {r.item.name}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
                marginTop: 2,
              }}
            >
              {t('v2.dashboard.priorityMeta', {
                code: r.categoryCode,
                quantity: r.item.quantity,
                recommended: r.recommended || '—',
                unit: r.item.unit,
              })}
              {r.item.expirationDate
                ? t('v2.dashboard.priorityExpires', {
                    date: r.item.expirationDate,
                  })
                : ''}
            </div>
          </div>
          <StatusPill status={r.status} />
        </div>
      ))}
    </Panel>
  );
}
