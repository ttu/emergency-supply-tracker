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
export function PriorityQueue({ onViewAll, limit = 5 }: PriorityQueueProps) {
  const { themeKey } = useDesignTheme();
  const { rows } = useDesignData();
  const priority = [...rows]
    .filter((r) => r.status !== 'ok')
    .sort((a, b) => (a.status === 'crit' ? -1 : b.status === 'crit' ? 1 : 0))
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
        <Caption>
          {themeKey === 'pantry'
            ? 'Needs your attention'
            : 'PRIORITY QUEUE · TOP ACTIONS'}
        </Caption>
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
          VIEW ALL →
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
          {themeKey === 'pantry'
            ? 'Nothing urgent. Nice work.'
            : 'NOMINAL · NO ACTION ITEMS'}
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
              {r.categoryCode} · {r.item.quantity} of {r.recommended || '—'}{' '}
              {r.item.unit}
              {r.item.expirationDate ? ` · exp ${r.item.expirationDate}` : ''}
            </div>
          </div>
          <StatusPill status={r.status} />
        </div>
      ))}
    </Panel>
  );
}
