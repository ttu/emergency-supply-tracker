import { GitHubIcon } from '@/shared/components';
import { CONTACT_EMAIL } from '@/shared/utils/constants';
import { useTranslation } from 'react-i18next';
import styles from './Help.module.css';

interface HelpTopic {
  id: string;
  question: string;
  answer: string;
}

export function Help() {
  const { t } = useTranslation();

  const helpTopics: HelpTopic[] = [
    {
      id: 'how-is-it-free',
      question: t('help.howIsItFree.question'),
      answer: t('help.howIsItFree.answer'),
    },
    {
      id: 'getting-started',
      question: t('help.gettingStarted.question'),
      answer: t('help.gettingStarted.answer'),
    },
    {
      id: 'household-size',
      question: t('help.householdSize.question'),
      answer: t('help.householdSize.answer'),
    },
    {
      id: 'recommended-items',
      question: t('help.recommendedItems.question'),
      answer: t('help.recommendedItems.answer'),
    },
    {
      id: 'expiration-dates',
      question: t('help.expirationDates.question'),
      answer: t('help.expirationDates.answer'),
    },
    {
      id: 'categories',
      question: t('help.categories.question'),
      answer: t('help.categories.answer'),
    },
    {
      id: 'status-colors',
      question: t('help.statusColors.question'),
      answer: t('help.statusColors.answer'),
    },
    {
      id: 'export-import',
      question: t('help.exportImport.question'),
      answer: t('help.exportImport.answer'),
    },
    {
      id: 'data-storage',
      question: t('help.dataStorage.question'),
      answer: t('help.dataStorage.answer'),
    },
    {
      id: 'shopping-list',
      question: t('help.shoppingList.question'),
      answer: t('help.shoppingList.answer'),
    },
    {
      id: 'preparedness-score',
      question: t('help.preparednessScore.question'),
      answer: t('help.preparednessScore.answer'),
    },
  ];

  return (
    <div className={styles.container} data-testid="page-help">
      <header className={styles.header}>
        <h1>{t('help.title')}</h1>
        <p className={styles.subtitle}>{t('help.subtitle')}</p>
      </header>

      <main className={styles.content}>
        <section className={styles.section} aria-labelledby="faq-heading">
          <h2 id="faq-heading">{t('help.faqTitle')}</h2>
          <div className={styles.faqList}>
            {helpTopics.map((topic) => (
              <div key={topic.id} className={styles.faqItem}>
                <div className={styles.faqQuestion}>
                  <span className={styles.questionIcon}>?</span>
                  <span className={styles.questionText}>{topic.question}</span>
                </div>
                <div className={styles.faqAnswer}>{topic.answer}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="tips-heading">
          <h2 id="tips-heading">{t('help.quickTipsTitle')}</h2>
          <ul className={styles.tipsList}>
            <li>{t('help.tips.tip1')}</li>
            <li>{t('help.tips.tip2')}</li>
            <li>{t('help.tips.tip3')}</li>
            <li>{t('help.tips.tip4')}</li>
            <li>{t('help.tips.tip5')}</li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="contact-heading">
          <h2 id="contact-heading">{t('help.contactTitle')}</h2>
          <p>{t('help.contactText')}</p>
          <div className={styles.contactLinks}>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
              {CONTACT_EMAIL}
            </a>
            <a
              href="https://github.com/ttu/emergency-supply-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <GitHubIcon className={styles.githubIcon} />
              {t('help.githubLink')}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
