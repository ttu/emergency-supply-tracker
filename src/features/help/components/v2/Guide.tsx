import { useTranslation } from 'react-i18next';
import {
  Caption,
  Panel,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { CONTACT_EMAIL } from '@/shared/utils/constants';

const SECTION_KEYS = [
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
  's7',
  's8',
  's9',
] as const;
const SECTION_CODES: Record<(typeof SECTION_KEYS)[number], string> = {
  s1: '§1',
  s2: '§2',
  s3: '§3',
  s4: '§4',
  s5: '§5',
  s6: '§6',
  s7: '§7',
  s8: '§8',
  s9: '§9',
};

export function Guide() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const sections = SECTION_KEYS.map((k) => ({
    code: SECTION_CODES[k],
    title: t(`v2.guide.sections.${k}.title.${themeKey}`),
    body: t(`v2.guide.sections.${k}.body`),
  }));
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
        <Caption>{t(`v2.voice.guide.${themeKey}`)}</Caption>
        <Title size={36} style={{ marginTop: 4 }}>
          {t(`v2.guide.title.${themeKey}`)}
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
          {t(`v2.guide.intro.${themeKey}`)}
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
      <Panel padding={24}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          {t(`v2.guide.supportTitle.${themeKey}`)}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            color: 'var(--color-text-2)',
            lineHeight: 1.65,
          }}
        >
          {t('help.contactText')}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            style={{
              fontSize: 13,
              color: 'var(--color-accent)',
            }}
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href="https://github.com/ttu/emergency-supply-tracker"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: 'var(--color-accent)',
            }}
          >
            {t('help.githubLink')}
          </a>
        </div>
      </Panel>
    </div>
  );
}
