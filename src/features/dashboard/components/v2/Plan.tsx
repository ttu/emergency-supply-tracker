import { useTranslation } from 'react-i18next';
import {
  Caption,
  NumberDisplay,
  Panel,
  StatusBar,
  StatusPill,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';

interface GoalSeed {
  code: string;
  key: string;
  p: number;
  target: string;
  status: 'crit' | 'warn' | 'ok';
}

// TODO(v2-release): GOAL_SEEDS percentages, targets, and statuses are static
// placeholder data carried over from the v2 design exploration. Before this
// view is exposed in production, derive `p` and `status` from real inventory
// + household state (see useDesignData) and either localise `target` strings
// or compute them from household + recommendation data. The Plan view is
// currently gated behind the settings.advanced.planView (beta) toggle.
// See docs/V2_RELEASE_TODO.md.
const GOAL_SEEDS: GoalSeed[] = [
  {
    code: 'G-01',
    key: 'g01',
    p: 32,
    target: '21 L/person · 84 L total',
    status: 'crit',
  },
  {
    code: 'G-02',
    key: 'g02',
    p: 78,
    target: '6000 kcal/person',
    status: 'warn',
  },
  {
    code: 'G-03',
    key: 'g03',
    p: 92,
    target: '3 sources · 30h runtime',
    status: 'ok',
  },
  {
    code: 'G-04',
    key: 'g04',
    p: 68,
    target: 'Per civil-defense list',
    status: 'warn',
  },
  { code: 'G-05', key: 'g05', p: 100, target: 'Stove + 7d fuel', status: 'ok' },
  {
    code: 'G-06',
    key: 'g06',
    p: 60,
    target: 'Radio + offline maps',
    status: 'warn',
  },
  { code: 'G-07', key: 'g07', p: 84, target: '€500 small bills', status: 'ok' },
  {
    code: 'G-08',
    key: 'g08',
    p: 100,
    target: 'Sealed + digital',
    status: 'ok',
  },
];

export function Plan() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const goals = GOAL_SEEDS.map((g) => ({
    ...g,
    name: t(`v2.plan.goals.${g.key}.${themeKey}`),
  }));
  const overall = Math.round(goals.reduce((s, g) => s + g.p, 0) / goals.length);
  const onTrack = goals.filter((g) => g.status === 'ok').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Caption>{t(`v2.voice.plan.${themeKey}`)}</Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {t(`v2.plan.title.${themeKey}`)}
        </Title>
      </div>
      <Panel padding={20}>
        <Caption>{t(`v2.plan.overall.${themeKey}`)}</Caption>
        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 20,
            alignItems: 'center',
          }}
        >
          <NumberDisplay
            value={overall}
            suffix="%"
            size={56}
            tone={overall >= 80 ? 'ok' : 'warn'}
          />
          <div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-2)',
                marginBottom: 6,
              }}
            >
              {t(`v2.plan.onTrack.${themeKey}`, {
                onTrack,
                total: goals.length,
              })}
            </div>
            <StatusBar
              ok={onTrack}
              warn={goals.length - onTrack}
              crit={0}
              total={goals.length}
              height={6}
            />
          </div>
        </div>
      </Panel>
      <Panel padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <Caption>
            {t(`v2.plan.goalsCount.${themeKey}`, { count: goals.length })}
          </Caption>
        </div>
        {goals.map((g, i) => (
          <div
            key={g.code}
            style={{
              padding: '14px 20px',
              display: 'grid',
              gridTemplateColumns: '70px 1.4fr 1fr 200px',
              gap: 16,
              alignItems: 'center',
              borderBottom:
                i < goals.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-3)',
              }}
            >
              {g.code}
            </span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {g.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-3)',
                  marginTop: 2,
                }}
              >
                {g.target}
              </div>
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-2)',
                }}
              >
                <span>{g.p}%</span>
                <span>100%</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <StatusBar ok={g.p} warn={0} crit={0} total={100} height={4} />
              </div>
            </div>
            <StatusPill status={g.status} />
          </div>
        ))}
      </Panel>
    </div>
  );
}
