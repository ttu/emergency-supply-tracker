import { useTranslation } from 'react-i18next';
import {
  Caption,
  Panel,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { CONTACT_EMAIL } from '@/shared/utils/constants';
import styles from './Guide.module.css';

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
    <div className={styles.page}>
      <div>
        <Caption>{t(`v2.voice.guide.${themeKey}`)}</Caption>
        <Title size={36} style={{ marginTop: 4 }}>
          {t(`v2.guide.title.${themeKey}`)}
        </Title>
        <div className={styles.intro}>{t(`v2.guide.intro.${themeKey}`)}</div>
      </div>
      <Panel padding={0}>
        {sections.map((s, i) => (
          <div
            key={s.code}
            className={`${styles.section} ${i === sections.length - 1 ? styles.sectionLast : ''}`}
          >
            <span className={styles.sectionCode}>{s.code}</span>
            <div>
              <div className={styles.sectionTitle}>{s.title}</div>
              <div className={styles.sectionBody}>{s.body}</div>
            </div>
          </div>
        ))}
      </Panel>
      <Panel padding={24}>
        <div className={styles.supportTitle}>
          {t(`v2.guide.supportTitle.${themeKey}`)}
        </div>
        <div className={styles.supportText}>
          {t(`v2.guide.howIsItFree.${themeKey}`)}
        </div>
        <div className={styles.supportText}>{t('help.contactText')}</div>
        <div className={styles.supportLinks}>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.supportLink}>
            {CONTACT_EMAIL}
          </a>
          <a
            href="https://github.com/ttu/emergency-supply-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.supportLink}
          >
            {t('help.githubLink')}
          </a>
        </div>
      </Panel>
    </div>
  );
}
