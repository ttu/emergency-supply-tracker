import { Caption, Panel, Title } from '../primitives';
import { useDesignTheme } from '../useDesignTheme';

export function Guide() {
  const { themeKey, voice } = useDesignTheme();
  const sections = [
    {
      code: '§1',
      title: themeKey === 'pantry' ? 'Why prepare?' : 'PURPOSE',
      body: 'Power outages, water disruptions, supply shocks. 72 hours of self-sufficiency is the practical baseline; one week is the recommended target for most households.',
    },
    {
      code: '§2',
      title: themeKey === 'pantry' ? 'Water — the priority' : 'WATER · TIER 1',
      body: 'Plan for 3 L/person/day for drinking and cooking, plus 3 L for hygiene. A two-person household needs ~84 L for one week. Bottled, jerrycans, or filled containers all qualify.',
    },
    {
      code: '§3',
      title: themeKey === 'pantry' ? 'Food that lasts' : 'FOOD · TIER 1',
      body: 'Calorie-dense, shelf-stable, edible without cooking: canned goods, dry pasta and rice, crackers, peanut butter, dried fruit. Rotate every 6–12 months.',
    },
    {
      code: '§4',
      title: themeKey === 'pantry' ? 'Light & warmth' : 'LIGHT & POWER',
      body: 'Two independent light sources per room. Battery-powered radio. Power bank charged. If applicable: gas stove with two days of fuel.',
    },
    {
      code: '§5',
      title: themeKey === 'pantry' ? 'First aid' : 'MEDICAL',
      body: 'Standard first-aid kit. Two weeks of any prescription medication. Iodine tablets per civil-defense recommendation.',
    },
    {
      code: '§6',
      title: themeKey === 'pantry' ? 'Documents & cash' : 'DOCS & CASH',
      body: 'Copies of ID, insurance, bank info. €500 in small bills. Both sealed in a waterproof container.',
    },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 920,
      }}
    >
      <div>
        <Caption>{voice.guide}</Caption>
        <Title size={36} style={{ marginTop: 4 }}>
          {themeKey === 'pantry'
            ? 'How to be prepared'
            : 'CIVIL PREPAREDNESS · BASELINE'}
        </Title>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            color: 'var(--color-text-2)',
            lineHeight: 1.6,
            maxWidth: 720,
          }}
        >
          {themeKey === 'pantry'
            ? 'A short, practical guide — what to keep at home so a power cut, water break, or supply shock is an inconvenience, not a crisis.'
            : 'BASELINE GUIDANCE FOR HOUSEHOLD PREPAREDNESS · 72-HOUR MINIMUM · 7-DAY TARGET.'}
        </div>
      </div>
      <Panel padding={0}>
        {sections.map((s, i) => (
          <div
            key={s.code}
            style={{
              padding: '20px 24px',
              borderBottom:
                i < sections.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
              display: 'grid',
              gridTemplateColumns: '60px 1fr',
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text-3)',
                fontWeight: 600,
              }}
            >
              {s.code}
            </span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: 'var(--color-text-2)',
                  lineHeight: 1.65,
                }}
              >
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}
