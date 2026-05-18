import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Caption, Title } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { KpiRow } from './KpiRow';
import { CoverageMatrix } from './CoverageMatrix';
import { PriorityQueue } from './PriorityQueue';

interface DashboardProps {
  onCategorySelect: (categoryId: string) => void;
  onViewAllPriority: () => void;
}

function pantryReadinessTitle(readiness: number, t: TFunction): string {
  if (readiness >= 80) return t('v2.dashboard.heroPantryReady');
  if (readiness >= 50) return t('v2.dashboard.heroPantryAttention');
  return t('v2.dashboard.heroPantryWork');
}

function dashboardHeroTitle(
  themeKey: string,
  readiness: number,
  t: TFunction,
): string {
  if (themeKey === 'pantry') return pantryReadinessTitle(readiness, t);
  if (themeKey === 'civil') return t('v2.dashboard.heroCivil');
  return t('v2.dashboard.heroCockpit');
}

export function Dashboard({
  onCategorySelect,
  onViewAllPriority,
}: Readonly<DashboardProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { readiness } = useDesignData();

  const heroTitle = dashboardHeroTitle(themeKey, readiness, t);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Caption>{t(`v2.voice.greeting.${themeKey}`)}</Caption>
        <Title size={36} style={{ marginTop: 6 }}>
          {heroTitle}
        </Title>
      </div>
      <KpiRow />
      <CoverageMatrix onCategorySelect={onCategorySelect} />
      <PriorityQueue onViewAll={onViewAllPriority} />
    </div>
  );
}
