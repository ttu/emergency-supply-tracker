import { useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  NumberDisplay,
  Panel,
  Title,
} from '@/shared/components/design-v2/primitives';
import { ThemePicker } from '@/features/settings/components/v2/ThemePicker';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useSettings } from '@/features/settings';
import type { HouseholdConfig, InventoryItem, Theme } from '@/shared/types';

interface OnboardingProps {
  onComplete: (household: HouseholdConfig, items: InventoryItem[]) => void;
}

type StepIndex = 1 | 2 | 3 | 4 | 5 | 6;

interface PresetDef {
  code: string;
  name: { cockpit: string; civil: string; pantry: string };
  adults: number;
  children: number;
  days: number;
  pets: number;
}

const PRESETS: PresetDef[] = [
  {
    code: 'P-01',
    name: { cockpit: 'SINGLE', civil: 'SINGLE', pantry: 'Single person' },
    adults: 1,
    children: 0,
    days: 7,
    pets: 0,
  },
  {
    code: 'P-02',
    name: { cockpit: 'COUPLE', civil: 'COUPLE', pantry: 'Couple' },
    adults: 2,
    children: 0,
    days: 7,
    pets: 0,
  },
  {
    code: 'P-03',
    name: {
      cockpit: 'FAMILY · WITH MINORS',
      civil: 'FAMILY · WITH MINORS',
      pantry: 'Family with children',
    },
    adults: 2,
    children: 2,
    days: 7,
    pets: 0,
  },
  {
    code: 'P-04',
    name: {
      cockpit: 'CUSTOM CONFIG',
      civil: 'CUSTOM CONFIG',
      pantry: 'Custom',
    },
    adults: 2,
    children: 0,
    days: 7,
    pets: 0,
  },
];

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
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

interface LayoutProps {
  step: number;
  title: string;
  lead: { title: string; sub?: string };
  children?: ReactNode;
  side?: ReactNode;
  back?: () => void;
  onContinue: () => void;
  primaryLabel?: string;
}

function OnboardLayout({
  step,
  title,
  lead,
  children,
  side,
  back,
  onContinue,
  primaryLabel,
}: LayoutProps) {
  const { themeKey, voice } = useDesignTheme();
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
          {voice.appName}
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
          STEP {String(step).padStart(2, '0')} / 05 · {title}
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
            {themeKey === 'pantry'
              ? 'You can change everything later in settings.'
              : 'ALL DATA IS STORED LOCALLY · NO ACCOUNT REQUIRED'}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {back && (
              <Button variant="secondary" onClick={back}>
                {voice.back}
              </Button>
            )}
            <Button variant="primary" onClick={onContinue}>
              {primaryLabel ?? voice.continueAction}
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

export function DesignOnboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<StepIndex>(1);
  const { themeKey, voice } = useDesignTheme();
  const { i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const [household, setHousehold] = useState<HouseholdConfig>({
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 7,
    useFreezer: false,
  });
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    new Set([
      'water-beverages',
      'food',
      'cooking-heat',
      'light-power',
      'communication-info',
      'medical-health',
      'hygiene-sanitation',
      'tools-supplies',
      'cash-documents',
    ]),
  );
  const [presetCode, setPresetCode] = useState<string>('P-02');

  const next = () => setStep((s) => Math.min(6, s + 1) as StepIndex);
  const back = () => setStep((s) => Math.max(1, s - 1) as StepIndex);

  const setLang = (lang: 'en' | 'fi') => {
    void i18n.changeLanguage(lang);
    updateSettings({ language: lang });
  };

  if (step === 1) {
    const langs: Array<{ code: 'en' | 'fi'; label: string; sub: string }> = [
      { code: 'en', label: 'English', sub: 'United Kingdom' },
      { code: 'fi', label: 'Suomi', sub: 'Suomi' },
    ];
    return (
      <OnboardLayout
        step={1}
        title={themeKey === 'pantry' ? 'Welcome' : 'WELCOME · LANGUAGE'}
        lead={{
          title:
            themeKey === 'pantry'
              ? "Let's set up your kit."
              : themeKey === 'civil'
                ? 'EMERGENCY SUPPLY TRACKER · INITIAL CONFIGURATION'
                : 'INITIALIZE · HOUSEHOLD PROFILE',
          sub:
            themeKey === 'pantry'
              ? "A short, five-step setup. We'll ask who lives with you and what you already have, then build a checklist based on civil-defense guidance."
              : 'FIVE-STEP PROVISIONING · NO ACCOUNT · NO CLOUD · ALL STATE LOCAL · ~90 SECONDS.',
        }}
        onContinue={next}
        side={
          <div>
            <Caption>
              {themeKey === 'pantry' ? "What you'll get" : 'OUTPUTS'}
            </Caption>
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {[
                [
                  '§1',
                  themeKey === 'pantry'
                    ? 'A baseline shopping list'
                    : 'BASELINE PROCUREMENT LIST',
                ],
                [
                  '§2',
                  themeKey === 'pantry'
                    ? 'Tracking by category'
                    : 'COVERAGE BY CATEGORY · 10 TIERS',
                ],
                [
                  '§3',
                  themeKey === 'pantry'
                    ? 'Expiry reminders'
                    : 'EXPIRY MONITORING',
                ],
                [
                  '§4',
                  themeKey === 'pantry'
                    ? 'A readiness score'
                    : 'READINESS METRIC',
                ],
              ].map(([code, t]) => (
                <div
                  key={code}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr',
                    gap: 14,
                    paddingBottom: 14,
                    borderBottom: '1px solid var(--color-rule-soft)',
                  }}
                >
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
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
                </div>
              ))}
            </div>
            <Caption style={{ marginTop: 32 }}>
              {themeKey === 'pantry' ? 'Language' : 'LANGUAGE · SELECT'}
            </Caption>
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {langs.map((l) => {
                const sel = settings.language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLang(l.code)}
                    aria-pressed={sel}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 24px',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 14px',
                      border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                      background: sel ? 'var(--color-panel-2)' : 'transparent',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      color: 'var(--color-text)',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: sel
                          ? 'var(--color-accent)'
                          : 'var(--color-text-2)',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {l.code.toUpperCase()}
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {l.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-3)',
                          marginTop: 2,
                        }}
                      >
                        {l.sub}
                      </div>
                    </div>
                    <span
                      aria-hidden
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                        background: sel ? 'var(--color-accent)' : 'transparent',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--color-accent-ink)',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {sel ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        }
      />
    );
  }

  if (step === 2) {
    return (
      <OnboardLayout
        step={2}
        title={themeKey === 'pantry' ? 'Appearance' : 'APPEARANCE · THEME'}
        lead={{
          title:
            themeKey === 'pantry'
              ? 'Pick a look.'
              : themeKey === 'civil'
                ? 'SELECT INTERFACE THEME'
                : 'CHOOSE THEME',
          sub:
            themeKey === 'pantry'
              ? 'Three looks, same app. You can switch any time in settings — your data and layout stay identical.'
              : 'SAME DATA · SAME LAYOUT · TOKENS, TYPE, AND TONE SWAP',
        }}
        back={back}
        onContinue={next}
      >
        <div>
          <ThemePicker
            value={settings.theme}
            onChange={(k: Theme) => updateSettings({ theme: k })}
          />
        </div>
      </OnboardLayout>
    );
  }

  if (step === 3) {
    return (
      <OnboardLayout
        step={3}
        title={
          themeKey === 'pantry' ? 'Household size' : 'PRESET · §3 BASELINE'
        }
        lead={{
          title:
            themeKey === 'pantry'
              ? 'Who are we planning for?'
              : 'SELECT HOUSEHOLD PRESET',
          sub:
            themeKey === 'pantry'
              ? 'Pick the closest match — you can fine-tune next.'
              : 'PRESETS PRE-FILL THE NEXT SECTION.',
        }}
        back={back}
        onContinue={() => {
          const preset = PRESETS.find((p) => p.code === presetCode)!;
          if (preset.code !== 'P-04') {
            setHousehold((h) => ({
              ...h,
              adults: preset.adults,
              children: preset.children,
              supplyDurationDays: preset.days,
              pets: preset.pets,
            }));
          }
          next();
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 14,
          }}
        >
          {PRESETS.map((p) => {
            const sel = presetCode === p.code;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => setPresetCode(p.code)}
                aria-pressed={sel}
                style={{
                  padding: 20,
                  border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                  background: sel ? 'var(--color-panel)' : 'transparent',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--color-text)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text-3)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {p.code}
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                      background: sel ? 'var(--color-accent)' : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--color-accent-ink)',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {sel ? '✓' : ''}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {p.name[themeKey]}
                </div>
                <div
                  style={{
                    marginTop: 18,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                    paddingTop: 16,
                    borderTop: '1px solid var(--color-rule-soft)',
                  }}
                >
                  <Stat
                    label={themeKey === 'pantry' ? 'Adults' : 'ADULTS'}
                    value={p.adults}
                  />
                  <Stat
                    label={themeKey === 'pantry' ? 'Children' : 'CHILDREN'}
                    value={p.children}
                  />
                  <Stat
                    label={themeKey === 'pantry' ? 'Days' : 'DAYS'}
                    value={p.days}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </OnboardLayout>
    );
  }

  if (step === 4) {
    const targets = computeTargets(household);
    return (
      <OnboardLayout
        step={4}
        title={themeKey === 'pantry' ? 'Details' : 'HOUSEHOLD · §4 PROFILE'}
        lead={{
          title:
            themeKey === 'pantry'
              ? 'Fine-tune your household.'
              : 'CONFIRM HOUSEHOLD PARAMETERS',
          sub:
            themeKey === 'pantry'
              ? 'These drive every recommendation. Adjust now or any time in settings.'
              : 'PARAMETERS DRIVE BASELINE QUANTITIES. EACH CHILD COUNTS AS 0.75 ADULT-EQUIVALENT.',
        }}
        back={back}
        onContinue={next}
        side={
          <div>
            <Caption>
              {themeKey === 'pantry' ? 'Calculated targets' : 'COMPUTED · LIVE'}
            </Caption>
            <div
              style={{
                marginTop: 16,
                padding: 20,
                background: 'var(--color-panel)',
                border: '1px solid var(--color-rule)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <NumberDisplay value={targets.water} size={48} />
                <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>
                  {themeKey === 'pantry'
                    ? 'litres of water'
                    : `L WATER · ${household.supplyDurationDays}D`}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-3)',
                  marginTop: 6,
                }}
              >
                = 3 L × {household.adults} ADULTS ×{' '}
                {household.supplyDurationDays} DAYS
              </div>
            </div>
            <div
              style={{
                marginTop: 14,
                padding: 20,
                background: 'var(--color-panel)',
                border: '1px solid var(--color-rule)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <NumberDisplay
                  value={targets.kcal.toLocaleString()}
                  size={36}
                />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-3)',
                  marginTop: 6,
                }}
              >
                {themeKey === 'pantry' ? 'Total kcal' : 'KCAL TOTAL'}
              </div>
            </div>
          </div>
        }
      >
        <Panel padding={0}>
          <Stepper
            label={themeKey === 'pantry' ? 'Adults' : 'ADULTS'}
            hint={
              themeKey === 'pantry' ? 'Aged 14+' : 'AGE ≥ 14 · FULL RATIONS'
            }
            value={household.adults}
            onChange={(v) => setHousehold((h) => ({ ...h, adults: v }))}
            min={1}
          />
          <Stepper
            label={themeKey === 'pantry' ? 'Children' : 'CHILDREN'}
            hint={
              themeKey === 'pantry'
                ? 'Under 14, scaled to 75%'
                : 'AGE < 14 · 0.75× SCALE'
            }
            value={household.children}
            onChange={(v) => setHousehold((h) => ({ ...h, children: v }))}
          />
          <Stepper
            label={themeKey === 'pantry' ? 'Pets' : 'PETS'}
            hint={
              themeKey === 'pantry'
                ? 'Adds a pet category'
                : 'ENABLES §PET CATEGORY'
            }
            value={household.pets}
            onChange={(v) => setHousehold((h) => ({ ...h, pets: v }))}
          />
        </Panel>
        <div style={{ marginTop: 14 }}>
          <Caption>
            {themeKey === 'pantry' ? 'Target days' : 'COVERAGE TARGET'}
          </Caption>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            {[3, 7, 14, 30].map((n) => {
              const sel = household.supplyDurationDays === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setHousehold((h) => ({ ...h, supplyDurationDays: n }))
                  }
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                    color: sel ? 'var(--color-accent)' : 'var(--color-text-2)',
                    background: 'transparent',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  {n}D
                </button>
              );
            })}
          </div>
        </div>
      </OnboardLayout>
    );
  }

  if (step === 5) {
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
        back={back}
        onContinue={next}
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
                onClick={() => {
                  setEnabledCategories((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
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

  // Step 6 — complete
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div style={{ maxWidth: 720, textAlign: 'left' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-accent)',
            letterSpacing: '0.12em',
          }}
        >
          ✓{' '}
          {themeKey === 'pantry'
            ? 'Setup complete · 5 / 5'
            : 'SETUP COMPLETE · 05 / 05'}
        </div>
        <Title size={56} style={{ marginTop: 18 }}>
          {themeKey === 'pantry' ? "You're set up." : 'PROVISIONING COMPLETE'}
        </Title>
        <div
          style={{
            marginTop: 18,
            fontSize: 16,
            color: 'var(--color-text-2)',
            lineHeight: 1.6,
          }}
        >
          {themeKey === 'pantry'
            ? "Your starting kit is ready. We'll keep an eye on expiry dates and remind you when something runs low — open the dashboard to see what's next."
            : `BASELINE PROVISIONED · ${enabledCategories.size} CATEGORIES ENABLED. EXPIRY MONITORING ACTIVE.`}
        </div>
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: 'var(--color-panel)',
            border: '1px solid var(--color-rule)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          <div>
            <Caption>{voice.readiness}</Caption>
            <div style={{ marginTop: 8 }}>
              <NumberDisplay value="0" suffix="%" size={36} tone="crit" />
            </div>
          </div>
          <div>
            <Caption>
              {themeKey === 'pantry' ? 'Categories' : 'CATEGORIES'}
            </Caption>
            <div style={{ marginTop: 8 }}>
              <NumberDisplay
                value={enabledCategories.size}
                suffix="/10"
                size={36}
              />
            </div>
          </div>
          <div>
            <Caption>
              {themeKey === 'pantry' ? 'Days target' : 'TARGET DAYS'}
            </Caption>
            <div style={{ marginTop: 8 }}>
              <NumberDisplay value={household.supplyDurationDays} size={36} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 32 }}>
          <Button variant="primary" onClick={() => onComplete(household, [])}>
            {themeKey === 'pantry' ? 'Open dashboard →' : 'OPEN OVERVIEW →'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <Caption>{label}</Caption>
      <div
        style={{
          fontFamily: 'var(--display-number-font)',
          fontSize: 22,
          fontWeight: 600,
          marginTop: 4,
          color: 'var(--color-text)',
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  const buttonStyle: CSSProperties = {
    width: 36,
    height: 36,
    border: '1px solid var(--color-rule)',
    background: 'transparent',
    color: 'var(--color-text)',
    fontSize: 18,
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
  };
  return (
    <div
      style={{
        padding: '18px 22px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <div>
        <Caption>{label}</Caption>
        <div
          style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 4 }}
        >
          {hint}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          style={buttonStyle}
        >
          −
        </button>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 28,
            fontWeight: 600,
            minWidth: 56,
            textAlign: 'center',
            color: 'var(--color-text)',
            fontFeatureSettings: '"tnum"',
          }}
        >
          {String(value).padStart(2, '0')}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          style={{
            ...buttonStyle,
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function computeTargets(h: HouseholdConfig) {
  const ppl = h.adults + h.children * 0.75;
  const water = Math.ceil(3 * ppl * h.supplyDurationDays);
  const kcal = Math.ceil(2200 * ppl * h.supplyDurationDays);
  return { water, kcal };
}
