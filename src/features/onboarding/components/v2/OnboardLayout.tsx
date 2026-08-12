import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Title } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import styles from './OnboardLayout.module.css';

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
    <div className={styles.stepBar}>
      {segmentIds.map((id, i) => (
        <div
          key={id}
          className={`${styles.stepSegment} ${i < step ? styles.stepSegmentActive : ''}`}
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
      className={`v2-viewport-height ${styles.viewport} ${sideBeside ? styles.viewportSideBeside : ''}`}
    >
      <div className={styles.contentColumn}>
        <div
          className={styles.brand}
          style={{ letterSpacing: themeKey === 'pantry' ? '-0.01em' : '0.1em' }}
        >
          <span
            className={styles.brandDot}
            style={{ borderRadius: themeKey === 'pantry' ? 999 : 0 }}
          />
          {t(`v2.voice.appName.${themeKey}`)}
        </div>
        <div className={styles.stepLabel}>
          {t('v2.onboarding.stepLabel', {
            step: String(step).padStart(2, '0'),
            total: String(total).padStart(2, '0'),
            title,
          })}
        </div>
        <div className={styles.stepBarWrap}>
          <StepBar step={step} total={total} />
        </div>
        <div className={styles.leadWrap}>
          <Title size={44}>{lead.title}</Title>
          {lead.sub && <div className={styles.leadSub}>{lead.sub}</div>}
        </div>
        <div className={styles.contentSlot}>{children}</div>
        {sideStacked && <div className={styles.sideStackedWrap}>{side}</div>}
        <div className={styles.footer}>
          <span className={styles.footerNote}>
            {t(`v2.onboarding.footerNote.${themeKey}`)}
          </span>
          <div className={styles.footerActions}>
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
      {sideBeside && <aside className={styles.sideAside}>{side}</aside>}
    </div>
  );
}
