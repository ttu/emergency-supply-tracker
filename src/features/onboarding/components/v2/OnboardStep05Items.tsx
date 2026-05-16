import { Caption, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { OnboardLayout } from './OnboardLayout';

interface OnboardStep05Props {
  enabledCategories: Set<string>;
  onToggleCategory: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Step 5: 10-row category checklist (toggle which categories to track). */
export function OnboardStep05Items({
  enabledCategories,
  onToggleCategory,
  onNext,
  onBack,
}: OnboardStep05Props) {
  const { themeKey } = useDesignTheme();
  const cats = [
    [
      'water-beverages',
      'H2O',
      themeKey === 'pantry' ? 'Water & beverages' : 'WATER & BEVERAGES',
    ],
    ['food', 'FUD', themeKey === 'pantry' ? 'Food' : 'FOOD'],
    [
      'cooking-heat',
      'CKH',
      themeKey === 'pantry' ? 'Cooking & heat' : 'COOKING & HEAT',
    ],
    [
      'light-power',
      'PWR',
      themeKey === 'pantry' ? 'Light & power' : 'LIGHT & POWER',
    ],
    [
      'communication-info',
      'CMM',
      themeKey === 'pantry' ? 'Communication' : 'COMMUNICATION',
    ],
    [
      'medical-health',
      'MED',
      themeKey === 'pantry' ? 'Medical' : 'MEDICAL & HEALTH',
    ],
    [
      'hygiene-sanitation',
      'HYG',
      themeKey === 'pantry' ? 'Hygiene' : 'HYGIENE & SANITATION',
    ],
    [
      'tools-supplies',
      'TLS',
      themeKey === 'pantry' ? 'Tools' : 'TOOLS & SUPPLIES',
    ],
    [
      'cash-documents',
      'DOC',
      themeKey === 'pantry' ? 'Cash & documents' : 'CASH & DOCUMENTS',
    ],
    ['pets', 'PET', themeKey === 'pantry' ? 'Pets' : 'PETS'],
  ] as const;

  return (
    <OnboardLayout
      step={5}
      title={
        themeKey === 'pantry' ? 'Starting kit' : 'BASELINE · §5 LINE ITEMS'
      }
      lead={{
        title:
          themeKey === 'pantry'
            ? 'What categories should we track?'
            : 'INITIAL INVENTORY · OPTIONAL',
        sub:
          themeKey === 'pantry'
            ? 'Tick the categories that apply to your household. You can add or remove items inside each one later.'
            : 'TOGGLE CATEGORIES. ALL TEN ENABLED BY DEFAULT.',
      }}
      back={onBack}
      onContinue={onNext}
      primaryLabel={
        themeKey === 'pantry' ? 'Finish setup' : 'COMMIT BASELINE →'
      }
    >
      <Panel padding={0}>
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--color-rule-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Caption>
            {themeKey === 'pantry'
              ? `${enabledCategories.size} of ${cats.length} enabled`
              : `CATEGORY ENABLEMENT · ${enabledCategories.size} / ${cats.length}`}
          </Caption>
        </div>
        {cats.map(([id, code, name], i) => {
          const enabled = enabledCategories.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggleCategory(id)}
              aria-pressed={enabled}
              style={{
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '20px 60px 1fr',
                gap: 14,
                alignItems: 'center',
                borderBottom:
                  i < cats.length - 1
                    ? '1px solid var(--color-rule-soft)'
                    : 'none',
                background: 'transparent',
                border: 0,
                fontFamily: 'inherit',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                opacity: enabled ? 1 : 0.5,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  border: `1.5px solid ${enabled ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                  background: enabled ? 'var(--color-accent)' : 'transparent',
                  borderRadius: themeKey === 'pantry' ? 4 : 0,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--color-accent-ink)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {enabled ? '✓' : ''}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-3)',
                  fontWeight: 600,
                }}
              >
                {code}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
            </button>
          );
        })}
      </Panel>
    </OnboardLayout>
  );
}
