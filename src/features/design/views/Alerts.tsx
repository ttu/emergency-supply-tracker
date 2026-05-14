import type { CSSProperties } from 'react';
import { Caption, NumberDisplay, Panel, StatusDot, Title } from '../primitives';
import { useDesignTheme } from '../useDesignTheme';
import { useDesignData } from '../useDesignData';
import type { DesignStatus } from '../status';

interface AlertsProps {
  onItemSelect: (id: string) => void;
}

export function Alerts({ onItemSelect }: AlertsProps) {
  const { themeKey, voice } = useDesignTheme();
  const { rows } = useDesignData();
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const alerts = rows
    .map((r, idx) => {
      let sev: DesignStatus | 'info' | null = null;
      let msg = '';
      if (r.item.quantity === 0) {
        sev = 'crit';
        msg =
          themeKey === 'pantry'
            ? 'Out of stock — buy soon.'
            : `${r.categoryCode} reached zero. Procure within 24h.`;
      } else if (r.item.expirationDate && !r.item.neverExpires) {
        const days =
          (new Date(r.item.expirationDate).getTime() - now) / 86_400_000;
        if (days < 0) {
          sev = 'crit';
          msg =
            themeKey === 'pantry'
              ? `Expired ${r.item.expirationDate}`
              : `Expired ${r.item.expirationDate}. Replace.`;
        } else if (days < 30) {
          sev = 'warn';
          msg =
            themeKey === 'pantry'
              ? `Best before ${r.item.expirationDate}`
              : `Expires ${r.item.expirationDate}.`;
        }
      }
      if (sev === null && r.recommended && r.item.quantity < r.recommended) {
        sev = 'warn';
        msg =
          themeKey === 'pantry'
            ? `${r.item.quantity} of ${r.recommended} ${r.item.unit}.`
            : `${r.item.quantity}/${r.recommended} ${r.item.unit} (${Math.round((r.item.quantity / r.recommended) * 100)}%).`;
      }
      if (sev === null) return null;
      return {
        sev,
        code: `A-${String(idx + 1).padStart(3, '0')}`,
        date: new Date().toISOString().slice(0, 10),
        title: r.item.name,
        msg,
        itemId: String(r.item.id),
        itemRef: r.categoryCode,
      };
    })
    .filter(Boolean) as Array<{
    sev: DesignStatus | 'info';
    code: string;
    date: string;
    title: string;
    msg: string;
    itemId: string;
    itemRef: string;
  }>;

  const counts = {
    crit: alerts.filter((a) => a.sev === 'crit').length,
    warn: alerts.filter((a) => a.sev === 'warn').length,
    info: alerts.filter((a) => a.sev === 'info').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Caption>{voice.alerts}</Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {themeKey === 'pantry' ? 'What needs attention' : 'ALERTS · LOG'}
        </Title>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        <Panel padding={20}>
          <Caption>{voice.critical}</Caption>
          <div style={{ marginTop: 10 }}>
            <NumberDisplay value={counts.crit} size={48} tone="crit" />
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{voice.warning}</Caption>
          <div style={{ marginTop: 10 }}>
            <NumberDisplay value={counts.warn} size={48} tone="warn" />
          </div>
        </Panel>
        <Panel padding={20}>
          <Caption>{themeKey === 'pantry' ? 'Info' : 'INFO'}</Caption>
          <div style={{ marginTop: 10 }}>
            <NumberDisplay value={counts.info} size={48} />
          </div>
        </Panel>
      </div>

      <Panel padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <Caption>
            {themeKey === 'pantry'
              ? 'Latest first'
              : 'EVENT STREAM · NEWEST FIRST'}
          </Caption>
        </div>
        {alerts.length === 0 && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--color-text-2)',
            }}
          >
            {themeKey === 'pantry'
              ? 'All clear. Nothing to act on.'
              : 'NOMINAL · ZERO ACTIVE ALERTS'}
          </div>
        )}
        {alerts.map((a, i) => {
          const rowStyle: CSSProperties = {
            padding: '14px 20px',
            display: 'grid',
            gridTemplateColumns: '70px 16px 90px 1fr 100px',
            gap: 14,
            alignItems: 'center',
            borderBottom:
              i < alerts.length - 1
                ? '1px solid var(--color-rule-soft)'
                : 'none',
          };
          return (
            <div key={a.code} style={rowStyle}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-3)',
                }}
              >
                {a.code}
              </span>
              <StatusDot
                status={a.sev === 'info' ? 'ok' : (a.sev as DesignStatus)}
                size={8}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-3)',
                }}
              >
                {a.date}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                  }}
                >
                  {a.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-2)',
                    marginTop: 2,
                  }}
                >
                  {a.msg}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onItemSelect(a.itemId)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-rule)',
                  color: 'var(--color-text-2)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-pill)',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                {voice.resolveAction}
              </button>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
