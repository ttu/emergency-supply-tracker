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

export function Dashboard({
  onCategorySelect,
  onViewAllPriority,
}: DashboardProps) {
  const { themeKey, voice } = useDesignTheme();
  const { readiness } = useDesignData();

  const heroTitle =
    themeKey === 'pantry'
      ? readiness >= 80
        ? 'Your household is mostly ready'
        : readiness >= 50
          ? 'A few things need attention'
          : 'Your kit needs work'
      : themeKey === 'civil'
        ? 'HOUSEHOLD READINESS REPORT'
        : 'HOUSEHOLD STATUS';

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
