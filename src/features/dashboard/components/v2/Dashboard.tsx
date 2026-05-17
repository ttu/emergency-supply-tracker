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

function pantryReadinessTitle(readiness: number): string {
  if (readiness >= 80) return 'Your household is mostly ready';
  if (readiness >= 50) return 'A few things need attention';
  return 'Your kit needs work';
}

function dashboardHeroTitle(themeKey: string, readiness: number): string {
  if (themeKey === 'pantry') return pantryReadinessTitle(readiness);
  if (themeKey === 'civil') return 'HOUSEHOLD READINESS REPORT';
  return 'HOUSEHOLD STATUS';
}

export function Dashboard({
  onCategorySelect,
  onViewAllPriority,
}: Readonly<DashboardProps>) {
  const { themeKey, voice } = useDesignTheme();
  const { readiness } = useDesignData();

  const heroTitle = dashboardHeroTitle(themeKey, readiness);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Caption>{voice.greeting}</Caption>
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
