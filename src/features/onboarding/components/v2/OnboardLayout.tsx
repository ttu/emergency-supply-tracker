import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Title } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';

interface StepBarProps {
  step: number;
  total: number;
}

/** Five-segment progress indicator for the onboarding flow. */
export function StepBar({ step, total }: Readonly<StepBarProps>) {
  const segmentIds = useMemo(
    () => Array.from({ length: total }, () => crypto.randomUUID()),
    [total],
  );
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {segmentIds.map((id, i) => (
        <div
          key={id}
          style={{
            flex: 1,
            height: 3,
            background: i < step ? 'var(--color-accent)' : 'var(--color-rule)',
            transition: 'background 200ms',
          }}
        />
      ))}
    </div>
  );
}

export interface OnboardLayoutProps {
  step: number;
  title: string;
  lead: { title: string; sub?: string };
  children?: ReactNode;
  side?: ReactNode;
  back?: () => void;
  onContinue: () => void;
  primaryLabel?: string;
}

/** Shared chrome for every onboarding step: brand, step bar, lead, content, footer. */
export function OnboardLayout({
  step,
  title,
  lead,
  children,
  side,
  back,
  onContinue,
  primaryLabel,
}: Readonly<OnboardLayoutProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        display: 'grid',
        gridTemplateColumns: side ? '1fr 1fr' : '1fr',
      }}
    >
      <div
        style={{
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: themeKey === 'pantry' ? '-0.01em' : '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              background: 'var(--color-accent)',
              borderRadius: themeKey === 'pantry' ? 999 : 0,
            }}
          />
          {t(`v2.voice.appName.${themeKey}`)}
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-3)',
            letterSpacing: '0.1em',
          }}
        >
          {t('v2.onboarding.stepLabel', {
            step: String(step).padStart(2, '0'),
            total: '05',
            title,
          })}
        </div>
        <div style={{ marginTop: 8 }}>
          <StepBar step={step} total={5} />
        </div>
        <div style={{ marginTop: 24 }}>
          <Title size={44}>{lead.title}</Title>
          {lead.sub && (
            <div
              style={{
                marginTop: 14,
                fontSize: 16,
                color: 'var(--color-text-2)',
                lineHeight: 1.55,
                maxWidth: 520,
              }}
            >
              {lead.sub}
            </div>
          )}
        </div>
        <div style={{ marginTop: 28, flex: 1 }}>{children}</div>
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 20,
            borderTop: '1px solid var(--color-rule-soft)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-3)',
              letterSpacing: '0.08em',
            }}
          >
            {t(`v2.onboarding.footerNote.${themeKey}`)}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {back && (
              <Button variant="secondary" onClick={back}>
                {t(`v2.voice.back.${themeKey}`)}
              </Button>
            )}
            <Button variant="primary" onClick={onContinue}>
              {primaryLabel ?? t(`v2.voice.continueAction.${themeKey}`)}
            </Button>
          </div>
        </div>
      </div>
      {side && (
        <aside
          style={{
            background: 'var(--color-bg-2)',
            borderLeft: '1px solid var(--color-rule)',
            padding: '48px 48px',
            overflow: 'auto',
          }}
        >
          {side}
        </aside>
      )}
    </div>
  );
}
