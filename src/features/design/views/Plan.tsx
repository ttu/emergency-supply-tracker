import {
  Caption,
  NumberDisplay,
  Panel,
  StatusBar,
  StatusPill,
  Title,
} from '../primitives';
import { useDesignTheme } from '../useDesignTheme';

export function Plan() {
  const { themeKey, voice } = useDesignTheme();
  const goals = [
    {
      code: 'G-01',
      name:
        themeKey === 'pantry' ? 'One week of water' : '7-DAY WATER COVERAGE',
      p: 32,
      target: '21 L/person · 84 L total',
      status: 'crit' as const,
    },
    {
      code: 'G-02',
      name: themeKey === 'pantry' ? 'Three days of food' : '72H FOOD AUTONOMY',
      p: 78,
      target: '6000 kcal/person',
      status: 'warn' as const,
    },
    {
      code: 'G-03',
      name: themeKey === 'pantry' ? 'Light without power' : 'OFF-GRID LIGHTING',
      p: 92,
      target: '3 sources · 30h runtime',
      status: 'ok' as const,
    },
    {
      code: 'G-04',
      name: themeKey === 'pantry' ? 'Basic first aid' : 'FIRST-AID KIT FULL',
      p: 68,
      target: 'Per civil-defense list',
      status: 'warn' as const,
    },
    {
      code: 'G-05',
      name:
        themeKey === 'pantry'
          ? 'Cooking without electricity'
          : 'OFF-GRID COOKING',
      p: 100,
      target: 'Stove + 7d fuel',
      status: 'ok' as const,
    },
    {
      code: 'G-06',
      name: themeKey === 'pantry' ? 'Information & comms' : 'COMMS REDUNDANCY',
      p: 60,
      target: 'Radio + offline maps',
      status: 'warn' as const,
    },
    {
      code: 'G-07',
      name: themeKey === 'pantry' ? 'Cash on hand' : 'CASH RESERVE',
      p: 84,
      target: '€500 small bills',
      status: 'ok' as const,
    },
    {
      code: 'G-08',
      name: themeKey === 'pantry' ? 'Documents copy' : 'DOCS BACKUP',
      p: 100,
      target: 'Sealed + digital',
      status: 'ok' as const,
    },
  ];
  const overall = Math.round(goals.reduce((s, g) => s + g.p, 0) / goals.length);
  const onTrack = goals.filter((g) => g.status === 'ok').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Caption>{voice.plan}</Caption>
        <Title size={32} style={{ marginTop: 4 }}>
          {themeKey === 'pantry'
            ? 'Goals & milestones'
            : 'PREPAREDNESS OBJECTIVES'}
        </Title>
      </div>
      <Panel padding={20}>
        <Caption>
          {themeKey === 'pantry' ? 'Overall' : 'OVERALL · 7-DAY TARGET'}
        </Caption>
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
              {themeKey === 'pantry'
                ? `${onTrack} of ${goals.length} goals on track`
                : `${onTrack} / ${goals.length} OBJECTIVES ON TRACK`}
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
            {themeKey === 'pantry'
              ? `${goals.length} goals`
              : `OBJECTIVES · ${goals.length} TRACKED`}
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
