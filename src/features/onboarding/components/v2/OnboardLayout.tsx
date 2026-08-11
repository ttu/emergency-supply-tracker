import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Title } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useIsMobile } from '@/shared/hooks/useIsMobile';

interface StepBarProps {
  step: number;
  total: number;
}

/** Five-segment progress indicator for the onboarding flow. */
export function StepBar({ step, total }: Readonly<StepBarProps>) {
  // The segments are a fixed-length, order-only list, so the index is the
  // stable identity. Random ids bought nothing and needed crypto to exist.
  const segmentIds = useMemo(
    () => Array.from({ length: total }, (_, i) => `step-${i}`),
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

/** Numbered steps in the flow; the completion screen is not one of them. */
export const ONBOARDING_STEP_COUNT = 6;

export interface OnboardLayoutProps {
  step: number;
  /** Numbered steps in the flow. */
  total?: number;
  title: string;
  lead: { title: string; sub?: string };
  children?: ReactNode;
  side?: ReactNode;
  back?: () => void;
  onContinue: () => void;
  primaryLabel?: string;
  continueDisabled?: boolean;
}

/** Shared chrome for every onboarding step: brand, step bar, lead, content, footer. */
export function OnboardLayout({
  step,
  total = ONBOARDING_STEP_COUNT,
  title,
  lead,
  children,
  side,
  back,
  onContinue,
  primaryLabel,
  continueDisabled,
}: Readonly<OnboardLayoutProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const isMobile = useIsMobile();

  // The side panel is a second column only where there is room for one. On a
  // phone it became a half-width column pushed off the edge of the screen, so
  // it moves into the main flow instead — after the step's content, before the
  // actions, which is also the order it should be read in.
  const sideBeside = side && !isMobile;
  const sideStacked = side && isMobile;

  return (
    <div
      data-testid="v2-onboard-layout"
      // Height comes from `.v2-viewport-height` (100dvh, falling back to
      // 100vh) — an inline height cannot carry the fallback declaration, and
      // on iOS a plain 100vh hides the footer behind the browser chrome.
      className="v2-viewport-height"
      style={{
        width: '100%',
        // The v2 themes lock document scrolling (design-themes.css) because
        // the desktop/mobile shells own their inner scroll. Onboarding runs
        // outside those shells, so it has to be its own scroll container —
        // otherwise anything taller than the viewport is simply unreachable.
        overflowY: 'auto',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        display: 'grid',
        gridTemplateColumns: sideBeside ? '1fr 1fr' : '1fr',
        // Stretch, not `start`: the row has to fill the viewport so the
        // footer sits at the bottom and the side panel's border runs the
        // full height. `start` sized the row to its content, which left a
        // short step — welcome, theme — floating above a band of dead
        // background. Stretch only distributes *spare* height, so a step
        // taller than the viewport still overflows and scrolls.
        alignContent: 'stretch',
      }}
    >
      <div
        style={{
          // 56px of side padding is over a quarter of a phone screen, which
          // pushed every step into horizontal scroll.
          padding: 'clamp(24px, 5vw, 48px) clamp(16px, 6vw, 56px)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
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
            total: String(total).padStart(2, '0'),
            title,
          })}
        </div>
        <div style={{ marginTop: 8 }}>
          <StepBar step={step} total={total} />
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
        {sideStacked && (
          <div
            style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop: '1px solid var(--color-rule)',
            }}
          >
            {side}
          </div>
        )}
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
            <Button
              variant="primary"
              onClick={onContinue}
              disabled={continueDisabled}
            >
              {primaryLabel ?? t(`v2.voice.continueAction.${themeKey}`)}
            </Button>
          </div>
        </div>
      </div>
      {sideBeside && (
        <aside
          style={{
            background: 'var(--color-bg-2)',
            borderLeft: '1px solid var(--color-rule)',
            padding: '48px 48px',
          }}
        >
          {side}
        </aside>
      )}
    </div>
  );
}
