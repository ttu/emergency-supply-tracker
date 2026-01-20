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
          <a
            href="https://github.com/ttu/emergency-supply-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            <svg
              className={styles.githubIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {t('help.githubLink')}
          </a>
        </section>
      </main>
    </div>
  );
}
